import type { VectorSearchResult, VectorStore, VectorStoreChunk } from '@contexta/rag';

export type PrismaPgVectorStoreConfig = {
  vectorDim: number;
};

type PrismaLike = {
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
  $queryRaw: <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
};

function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((n) => (Number.isFinite(n) ? n : 0)).join(',')}]`;
}

function pickPageVersionId(metadata: Record<string, unknown> | undefined): string | null {
  const v = metadata?.pageVersionId;
  return typeof v === 'string' && v.trim() ? v : null;
}

export class PrismaPgVectorVectorStore implements VectorStore {
  public readonly vectorDim: number;

  constructor(
    private readonly prisma: PrismaLike,
    private readonly config: PrismaPgVectorStoreConfig,
  ) {
    this.vectorDim = config.vectorDim;
  }

  async upsert(chunks: VectorStoreChunk[]) {
    if (chunks.length === 0) return { upserted: 0 };

    for (const c of chunks) {
      const embedding = toVectorLiteral(c.embedding);
      const pageVersionId = pickPageVersionId(c.metadata);
      const metadata = c.metadata ?? null;

      await this.prisma.$executeRaw`
        INSERT INTO "rag_chunks" (
          "id", "tenant_id", "page_id", "page_version_id", "chunk_index", "content", "embedding", "metadata", "is_deleted", "created_by", "updated_by", "created_at", "updated_at"
        ) VALUES (
          ${c.id}, ${c.tenantId}, ${c.sourceId}, ${pageVersionId}, ${c.chunkIndex}, ${c.content}, ${embedding}::vector, ${metadata}::jsonb, false, 'system', 'system', NOW(), NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "tenant_id" = EXCLUDED."tenant_id",
          "page_id" = EXCLUDED."page_id",
          "page_version_id" = EXCLUDED."page_version_id",
          "chunk_index" = EXCLUDED."chunk_index",
          "content" = EXCLUDED."content",
          "embedding" = EXCLUDED."embedding",
          "metadata" = EXCLUDED."metadata",
          "is_deleted" = false,
          "updated_at" = NOW();
      `;
    }

    return { upserted: chunks.length };
  }

  async deleteBySource(input: { tenantId: string; sourceId: string }) {
    const deleted = await this.prisma.$executeRaw`
      DELETE FROM "rag_chunks"
      WHERE "tenant_id" = ${input.tenantId}
        AND "page_id" = ${input.sourceId};
    `;

    return { deleted };
  }

  async similaritySearch(
    queryEmbedding: number[],
    input: { topK: number; filter: { tenantId: string; sourceId?: string; metadata?: Record<string, unknown> } },
  ) {
    const topK = Math.max(1, Math.min(50, Math.trunc(input.topK)));
    const q = toVectorLiteral(queryEmbedding);
    const sourceId = input.filter.sourceId ?? null;

    const rawSpaceIds = input.filter.metadata?.spaceIds;
    const spaceIds = Array.isArray(rawSpaceIds)
      ? rawSpaceIds
          .filter((x) => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
      : null;

    const rawSpaceId = input.filter.metadata?.spaceId;
    const spaceId = typeof rawSpaceId === 'string' && rawSpaceId.trim()
      ? rawSpaceId.trim()
      : null;

    const effectiveSpaceIds = spaceIds && spaceIds.length > 0 ? spaceIds : null;

    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      page_id: string;
      page_version_id: string | null;
      chunk_index: number;
      content: string;
      distance: number;
    }>>`
      SELECT
        rc."id",
        rc."page_id",
        rc."page_version_id",
        rc."chunk_index",
        rc."content",
        (rc."embedding" <-> ${q}::vector) AS distance
      FROM "rag_chunks" rc
      LEFT JOIN "pages" p
        ON p."id" = rc."page_id"
       AND p."tenant_id" = rc."tenant_id"
      WHERE rc."tenant_id" = ${input.filter.tenantId}
        AND (${sourceId}::text IS NULL OR rc."page_id" = ${sourceId}::text)
        AND (
          (
            ${effectiveSpaceIds}::text[] IS NOT NULL
            AND p."space_id" = ANY(${effectiveSpaceIds}::text[])
          )
          OR (
            ${effectiveSpaceIds}::text[] IS NULL
            AND (${spaceId}::text IS NULL OR p."space_id" = ${spaceId}::text)
          )
        )
      ORDER BY distance ASC
      LIMIT ${topK};
    `;

    const results: VectorSearchResult[] = rows.map((r) => ({
      id: r.id,
      sourceId: r.page_id,
      chunkIndex: r.chunk_index,
      content: r.content,
      score: 1 / (1 + Math.max(0, r.distance)),
    }));

    return results;
  }
}
