import type {
  AiKnowledgeSearcher,
  AiKnowledgeSearchItem,
} from '@contexta/application';
import {
  OpenAICompatibleEmbeddingProvider,
} from '@contexta/rag';
import { PrismaPgVectorVectorStore } from '@contexta/infrastructure';
import type { PrismaService } from '../prisma/prisma.service';

export class DisabledAiKnowledgeSearcher implements AiKnowledgeSearcher {
  async search(_input: {
    tenantId: string;
    query: string;
    topK?: number;
    scope?: { spaceId?: string | null; spaceIds?: string[] | null };
  }): Promise<{ items: AiKnowledgeSearchItem[] }> {
    return { items: [] };
  }
}

export class PrismaVectorAiKnowledgeSearcher implements AiKnowledgeSearcher {
  private readonly vectorStore: PrismaPgVectorVectorStore;
  private readonly embeddings: OpenAICompatibleEmbeddingProvider;

  private readonly vectorDim: number;
  private readonly defaultTopK: number;
  private readonly similarityThreshold: number;

  constructor(
    prisma: PrismaService,
    config: {
      vectorDim: number;
      defaultTopK: number;
      similarityThreshold: number;
      apiKey: string;
      baseUrl: string;
      embedModel: string;
    },
  ) {
    this.vectorDim = config.vectorDim;
    this.defaultTopK = config.defaultTopK;
    this.similarityThreshold = config.similarityThreshold;

    this.vectorStore = new PrismaPgVectorVectorStore(prisma, {
      vectorDim: this.vectorDim,
    });

    this.embeddings = new OpenAICompatibleEmbeddingProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.embedModel,
    });
  }

  async search(input: {
    tenantId: string;
    query: string;
    topK?: number;
    scope?: { spaceId?: string | null; spaceIds?: string[] | null };
  }): Promise<{ items: AiKnowledgeSearchItem[] }> {
    const tenantId = input.tenantId;
    if (!tenantId) throw new Error('tenantId is required');

    const query = String(input.query ?? '').trim();
    if (!query) throw new Error('query is required');

    const topK = Number.isFinite(input.topK)
      ? Math.max(1, Math.min(50, Math.trunc(input.topK as number)))
      : this.defaultTopK;

    const scopeSpaceIds = Array.isArray(input.scope?.spaceIds)
      ? input.scope?.spaceIds
          .filter((x) => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
      : null;

    const scopeSpaceId =
      typeof input.scope?.spaceId === 'string' && input.scope.spaceId.trim()
        ? input.scope.spaceId.trim()
        : null;

    const spaceIds = scopeSpaceIds && scopeSpaceIds.length > 0 ? scopeSpaceIds : null;
    const spaceId = spaceIds ? null : scopeSpaceId;

    const embedding = await this.embeddings.embedQuery(query);
    if (embedding.length !== this.vectorDim) {
      throw new Error(
        `vectorDim mismatch: expected ${this.vectorDim}, got ${embedding.length}`,
      );
    }

    const candidates = await this.vectorStore.similaritySearch(embedding, {
      topK,
      filter: {
        tenantId,
        metadata: spaceIds ? { spaceIds } : spaceId ? { spaceId } : undefined,
      },
    });

    const items: AiKnowledgeSearchItem[] = candidates
      .filter((c) => Number.isFinite(c.score) && c.score <= this.similarityThreshold)
      .map((c) => ({
        id: c.id,
        pageId: c.sourceId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        score: c.score,
      }));

    return { items };
  }
}
