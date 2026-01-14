import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OpenAICompatibleChatProvider,
  OpenAICompatibleEmbeddingProvider,
  RAG,
} from '@contexta/rag';
import {
  PrismaPgVectorVectorStore,
  PrismaPublishedPageKnowledgeSource,
} from '@contexta/infrastructure';
import { slateToPlainText } from '@contexta/slate-converters';

@Injectable()
export class RagService {
  private sdk: RAG;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.VOLCENGINE_API_KEY || '';
    const baseUrl = process.env.VOLC_BASE_URL || '';
    const chatModel = process.env.VOLC_CHAT_MODEL ?? '';
    const embedModel = process.env.VOLC_EMBED_MODEL ?? '';

    if (!apiKey)
      throw new BadRequestException('VOLCENGINE_API_KEY is required');
    if (!chatModel)
      throw new BadRequestException('VOLC_CHAT_MODEL is required');
    if (!embedModel)
      throw new BadRequestException('VOLC_EMBED_MODEL is required');

    const vectorDim = Number(process.env.RAG_VECTOR_DIM ?? 2560);
    const topK = Number(process.env.RAG_TOP_K ?? 8);
    const threshold = Number(process.env.RAG_SIMILARITY_THRESHOLD ?? 0.5);

    const splitter = {
      chunkSize: Number(process.env.RAG_CHUNK_SIZE ?? 800),
      chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP ?? 120),
    };

    const vectorStore = new PrismaPgVectorVectorStore(this.prisma, {
      vectorDim,
    });

    const embeddings = new OpenAICompatibleEmbeddingProvider({
      apiKey,
      baseUrl,
      model: embedModel,
    });

    const chat = new OpenAICompatibleChatProvider({
      apiKey,
      baseUrl,
      model: chatModel,
    });

    this.sdk = new RAG({
      vectorStore,
      embeddings,
      chat,
      splitter,
      retrieval: {
        topK,
        similarityThreshold: threshold,
      },
    });
  }

  answerStream(tenantId: string, question: string, options?: { signal?: AbortSignal }) {
    const q = question?.trim() ?? '';
    if (!q) throw new BadRequestException('question is required');

    return this.sdk.answerStream({ tenantId, question: q }, options);
  }

  async indexPublished(
    tenantId: string,
    pageId: string,
    pageVersionId: string,
  ) {
    const knowledgeSource = new PrismaPublishedPageKnowledgeSource(this.prisma);
    const published = await knowledgeSource.getPublishedPageVersion({
      tenantId,
      pageId,
      pageVersionId,
    });
    const plain = slateToPlainText(published.content);

    return this.sdk.indexText({
      tenantId,
      sourceId: pageId,
      text: plain,
      options: {
        metadata: {
          pageVersionId,
        },
      },
    });
  }
}
