import type { AiKnowledgeSearcher, AiKnowledgeSearchItem } from './ports/ai-knowledge-searcher';

export class AiKnowledgeSearchUseCase {
  constructor(private readonly searcher: AiKnowledgeSearcher) {}

  async search(params: {
    tenantId: string;
    query: string;
    topK?: number;
    spaceId?: string | null;
  }): Promise<{ items: AiKnowledgeSearchItem[] }> {
    if (!params.tenantId) throw new Error('tenantId is required');

    const query = String(params.query ?? '').trim();
    if (!query) throw new Error('query is required');

    const topKRaw = params.topK;
    const topK = Number.isFinite(topKRaw)
      ? Math.max(1, Math.min(50, Math.trunc(topKRaw as number)))
      : undefined;

    const spaceId = typeof params.spaceId === 'string' && params.spaceId.trim()
      ? params.spaceId.trim()
      : undefined;

    return await this.searcher.search({
      tenantId: params.tenantId,
      query,
      topK,
      scope: spaceId ? { spaceId } : undefined,
    });
  }
}
