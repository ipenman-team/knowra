import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import {
  OpenAICompatibleChatProvider,
  OpenAICompatibleEmbeddingProvider,
  RAG,
} from '@knowra/rag';
import { pdfPagesToMarkdown } from '@knowra/slate-converters';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaPgVectorAttachmentStore } from './attachment-vector-store';
import { InternalNotificationClient } from './internal-notification.client';

type UploadedFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

export type AttachmentUploadResult = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
};

type AttachmentContextResult = {
  context?: string;
  itemCount: number;
};

@Injectable()
export class AttachmentsService {
  private readonly enabled: boolean;
  private readonly rag?: RAG;
  private readonly embeddings?: OpenAICompatibleEmbeddingProvider;
  private readonly vectorStore?: PrismaPgVectorAttachmentStore;

  private readonly vectorDim: number;
  private readonly topK: number;
  private readonly similarityThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationClient: InternalNotificationClient,
  ) {
    const apiKey = process.env.VOLCENGINE_API_KEY || '';
    const baseUrl = process.env.VOLC_BASE_URL || '';
    const embedModel = process.env.VOLC_EMBED_MODEL || '';
    const chatModel = process.env.VOLC_CHAT_MODEL || '';

    this.enabled = Boolean(apiKey && baseUrl && embedModel && chatModel);

    const vectorDim = Number(process.env.RAG_VECTOR_DIM ?? 2560);
    const topK = Number(process.env.RAG_ATTACHMENT_TOP_K ?? process.env.RAG_TOP_K ?? 8);
    const similarityThreshold = Number(
      process.env.RAG_ATTACHMENT_SIMILARITY_THRESHOLD ??
        process.env.RAG_SIMILARITY_THRESHOLD ??
        0.35,
    );

    this.vectorDim = Number.isFinite(vectorDim) ? vectorDim : 2560;
    this.topK = Number.isFinite(topK) ? topK : 8;
    this.similarityThreshold = Number.isFinite(similarityThreshold)
      ? similarityThreshold
      : 0.35;

    if (!this.enabled) return;

    const splitter = {
      chunkSize: Number(process.env.RAG_CHUNK_SIZE ?? 800),
      chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP ?? 120),
    };

    this.vectorStore = new PrismaPgVectorAttachmentStore(this.prisma, {
      vectorDim: this.vectorDim,
    });

    this.embeddings = new OpenAICompatibleEmbeddingProvider({
      apiKey,
      baseUrl,
      model: embedModel,
    });

    const chat = new OpenAICompatibleChatProvider({
      apiKey,
      baseUrl,
      model: chatModel,
    });

    this.rag = new RAG({
      vectorStore: this.vectorStore,
      embeddings: this.embeddings,
      chat,
      splitter,
      retrieval: {
        topK: this.topK,
        similarityThreshold: this.similarityThreshold,
      },
    });
  }

  async uploadAttachments(params: {
    tenantId: string;
    conversationId: string;
    actorUserId: string;
    files: UploadedFile[];
  }): Promise<AttachmentUploadResult[]> {
    if (!this.enabled || !this.rag) {
      throw new BadRequestException('attachment indexing is not configured');
    }
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    if (!params.conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('conversation not found');

    const files = params.files ?? [];
    if (files.length === 0) throw new BadRequestException('files is required');

    const results: AttachmentUploadResult[] = [];
    for (const file of files) {
      const text = await this.extractText(file);
      const cleaned = text.trim();
      if (!cleaned) throw new BadRequestException('file content is empty');

      const attachmentId = `att_${crypto.randomUUID()}`;
      const fileName = sanitizeFileName(file.originalname);
      const mimeType = String(file.mimetype ?? 'application/octet-stream');
      const size = Number(file.size ?? 0);

      const metadata = {
        sourceType: 'attachment',
        attachmentId,
        conversationId: params.conversationId,
        fileName,
        mimeType,
        size,
        uploadedBy: params.actorUserId,
        uploadedAt: new Date().toISOString(),
      };

      const indexed = await this.rag.indexText({
        tenantId: params.tenantId,
        sourceId: attachmentId,
        text: cleaned,
        options: {
          metadata,
          chunkIdPrefix: attachmentId,
          overwrite: 'source',
        },
      });

      if (!indexed.chunkCount) {
        throw new BadRequestException('file content is empty');
      }

      results.push({
        id: attachmentId,
        name: fileName,
        size,
        mimeType,
        chunkCount: indexed.chunkCount,
      });
    }

    void this.notificationClient.send({
      tenantId: params.tenantId,
      receiverIds: [params.actorUserId],
      type: 'AI_DONE',
      title: '知识库索引已完成',
      body: `已完成 ${results.length} 个附件索引，可开始问答`,
      link: '/knowra-ai',
      metadata: {
        conversationId: params.conversationId,
        attachmentCount: results.length,
        source: 'knowra-ai.attachments',
      },
    });

    return results;
  }

  async buildContext(params: {
    tenantId: string;
    query: string;
    attachmentIds?: string[];
  }): Promise<AttachmentContextResult> {
    const attachmentIds = normalizeAttachmentIds(params.attachmentIds);
    if (attachmentIds.length === 0) return { context: undefined, itemCount: 0 };

    if (!this.enabled || !this.embeddings || !this.vectorStore) {
      throw new BadRequestException('attachment search is not configured');
    }

    const query = String(params.query ?? '').trim();
    if (!query) return { context: undefined, itemCount: 0 };

    const embedding = await this.embeddings.embedQuery(query);
    if (embedding.length !== this.vectorDim) {
      throw new BadRequestException(
        `vectorDim mismatch: expected ${this.vectorDim}, got ${embedding.length}`,
      );
    }

    const candidates = await this.vectorStore.similaritySearch(embedding, {
      topK: this.topK,
      filter: {
        tenantId: params.tenantId,
        metadata: {
          attachmentIds,
          sourceType: 'attachment',
        },
      },
    });

    const items = candidates.filter(
      (c) => Number.isFinite(c.score) && c.score <= this.similarityThreshold,
    );
    if (items.length === 0) return { context: undefined, itemCount: 0 };

    const context = items
      .slice(0, 6)
      .map((c, i) => {
        const meta = c.metadata ?? {};
        const fileName =
          typeof meta.fileName === 'string' && meta.fileName.trim()
            ? meta.fileName.trim()
            : c.sourceId;
        return `【${i + 1} ${fileName}#${c.chunkIndex}】\n${String(c.content).trim()}`;
      })
      .join('\n\n');

    return {
      itemCount: items.length,
      context: [
        '你可以参考以下用户上传的资料片段来回答问题。',
        '要求：仅在资料支持的范围内回答；如果资料不足以回答，请直接说明不知道并可提出 1 个澄清问题。',
        '',
        context,
      ].join('\n'),
    };
  }

  private async extractText(file: UploadedFile): Promise<string> {
    const buffer = file.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('file content is empty');
    }

    const fileName = sanitizeFileName(file.originalname);
    const ext = path.extname(fileName).toLowerCase();
    const mime = String(file.mimetype ?? '').toLowerCase();

    if (ext === '.pdf' || mime === 'application/pdf') {
      if (!AttachmentsService.looksLikePdf(buffer)) {
        throw new BadRequestException('invalid pdf');
      }
      return await this.parsePdf(buffer);
    }

    if (
      ext === '.docx' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      if (!AttachmentsService.looksLikeDocx(buffer)) {
        throw new BadRequestException('invalid docx');
      }
      return await this.parseDocx(buffer);
    }

    if (ext === '.md' || ext === '.markdown' || mime === 'text/markdown') {
      return buffer.toString('utf-8');
    }

    if (ext === '.txt' || mime.startsWith('text/')) {
      return buffer.toString('utf-8');
    }

    throw new BadRequestException('format not supported');
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    let pages: string[] = [];
    try {
      const textResult = await parser.getText();
      pages = (textResult.pages ?? []).map((p) => p.text ?? '');
    } finally {
      try {
        await parser.destroy();
      } catch {
        // ignore
      }
    }

    const markdown = pdfPagesToMarkdown(pages);
    const normalized = String(markdown ?? '').trim();
    if (normalized) return normalized;

    const fallback = pages.join('\n').trim();
    return fallback;
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    const result = await (
      mammoth as unknown as {
        convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }>;
      }
    ).convertToMarkdown({ buffer });

    const normalized = String(result?.value ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return normalized;
  }

  private static looksLikePdf(buffer: Buffer): boolean {
    if (!buffer?.length) return false;
    if (buffer.length < 5) return false;
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  private static looksLikeDocx(buffer: Buffer): boolean {
    if (!buffer?.length) return false;
    if (buffer.length < 2) return false;
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }
}

function sanitizeFileName(name?: string): string {
  const base = (name ?? '').trim();
  if (!base) return 'untitled';
  return base.replace(/[\\/]/g, '_');
}

function normalizeAttachmentIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const uniq = new Set<string>();
  for (const raw of ids) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    uniq.add(trimmed);
  }
  return Array.from(uniq);
}
