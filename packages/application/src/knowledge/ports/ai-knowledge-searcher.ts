export type AiKnowledgeSearchItem = {
  id: string;
  pageId: string;
  chunkIndex: number;
  content: string;
  score: number;
};

export type AiKnowledgeSearchScope = {
  /**
   * Preferred: restrict search to these space ids.
   * Empty/undefined means search all spaces.
   */
  spaceIds?: string[] | null;
  /**
   * Backward compatible single space filter.
   * If both spaceIds and spaceId are provided, spaceIds takes precedence.
   */
  spaceId?: string | null;
};

export interface AiKnowledgeSearcher {
  search(input: {
    tenantId: string;
    query: string;
    topK?: number;
    scope?: AiKnowledgeSearchScope;
  }): Promise<{ items: AiKnowledgeSearchItem[] }>;
}
