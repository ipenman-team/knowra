import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateShareSnapshotParams,
  ShareSnapshot,
  ShareSnapshotRepository,
} from '@knowra/domain';

function toDomain(row: {
  id: string;
  tenantId: string;
  shareId: string;
  payload: Prisma.JsonValue;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ShareSnapshot {
  return {
    id: row.id,
    tenantId: row.tenantId,
    shareId: row.shareId,
    payload: row.payload,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaShareSnapshotRepository implements ShareSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: CreateShareSnapshotParams): Promise<ShareSnapshot> {
    const created = await this.prisma.shareSnapshot.create({
      data: {
        tenantId: params.tenantId,
        shareId: params.shareId,
        payload: params.payload as Prisma.InputJsonValue,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });

    return toDomain(created);
  }

  async getLatestByShareId(params: {
    tenantId: string;
    shareId: string;
  }): Promise<ShareSnapshot | null> {
    const row = await this.prisma.shareSnapshot.findFirst({
      where: {
        tenantId: params.tenantId,
        shareId: params.shareId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return row ? toDomain(row) : null;
  }
}
