import type { VectorSearchResult, VectorStore, VectorStoreChunk } from '@knowra/rag';
import type { PrismaService } from '../prisma/prisma.service';

export type PrismaPgVectorAttachmentStoreConfig = {
  vectorDim: number;
};

function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((n) => (Number.isFinite(n) ? n : 0)).join(',')}]`;
}

function normalizeStringArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const out = input
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim())
    .filter(Boolean);
  return out.length ? out : null;
}

function normalizeString(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  return v ? v : null;
}

function toMetadataRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return value as Record<string, unknown>;
}

export class PrismaPgVectorAttachmentStore implements VectorStore {
  public readonly vectorDim: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: PrismaPgVectorAttachmentStoreConfig,
  ) {
    this.vectorDim = config.vectorDim;
  }

  async upsert(chunks: VectorStoreChunk[]) {
    if (chunks.length === 0) return { upserted: 0 };

    for (const c of chunks) {
      const embedding = toVectorLiteral(c.embedding);
      const metadata = c.metadata ?? null;

      await this.prisma.$executeRaw`
        INSERT INTO "rag_chunks" (
          "id", "tenant_id", "page_id", "page_version_id", "chunk_index", "content", "embedding", "metadata", "is_deleted", "created_by", "updated_by", "created_at", "updated_at"
        ) VALUES (
          ${c.id}, ${c.tenantId}, ${c.sourceId}, NULL, ${c.chunkIndex}, ${c.content}, ${embedding}::vector, ${metadata}::jsonb, false, 'system', 'system', NOW(), NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "tenant_id" = EXCLUDED."tenant_id",
          "page_id" = EXCLUDED."page_id",
          "page_version_id" = NULL,
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
  ): Promise<VectorSearchResult[]> {
    const topK = Math.max(1, Math.min(50, Math.trunc(input.topK)));
    const q = toVectorLiteral(queryEmbedding);
    const sourceId = normalizeString(input.filter.sourceId);

    const attachmentIds = normalizeStringArray(input.filter.metadata?.attachmentIds);
    const conversationId = normalizeString(input.filter.metadata?.conversationId);
    const sourceType =
      normalizeString(input.filter.metadata?.sourceType) ?? 'attachment';

    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      page_id: string;
      chunk_index: number;
      content: string;
      distance: number;
      metadata: unknown;
    }>>`
      SELECT
        rc."id",
        rc."page_id",
        rc."chunk_index",
        rc."content",
        rc."metadata",
        (rc."embedding" <-> ${q}::vector) AS distance
      FROM "rag_chunks" rc
      WHERE rc."tenant_id" = ${input.filter.tenantId}
        AND rc."is_deleted" = false
        AND (${sourceId}::text IS NULL OR rc."page_id" = ${sourceId}::text)
        AND (
          ${attachmentIds}::text[] IS NULL
          OR rc."page_id" = ANY(${attachmentIds}::text[])
        )
        AND (${sourceType}::text IS NULL OR (rc."metadata"->>'sourceType') = ${sourceType}::text)
        AND (
          ${conversationId}::text IS NULL
          OR (rc."metadata"->>'conversationId') = ${conversationId}::text
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
      metadata: toMetadataRecord(r.metadata),
    }));

    return results;
  }
}
