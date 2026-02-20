import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateShareAccessLogParams,
  ShareAccessLog,
  ShareAccessLogRepository,
} from '@knowra/domain';

function toDomain(row: {
  id: string;
  tenantId: string;
  shareId: string;
  ip: string | null;
  userAgent: string | null;
  accessedAt: Date;
  extraData: Prisma.JsonValue | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ShareAccessLog {
  return {
    id: row.id,
    tenantId: row.tenantId,
    shareId: row.shareId,
    ip: row.ip,
    userAgent: row.userAgent,
    accessedAt: row.accessedAt,
    extraData: row.extraData,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaShareAccessLogRepository implements ShareAccessLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: CreateShareAccessLogParams): Promise<ShareAccessLog> {
    const created = await this.prisma.shareAccessLog.create({
      data: {
        tenantId: params.tenantId,
        shareId: params.shareId,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        accessedAt: params.accessedAt ?? new Date(),
        extraData:
          params.extraData == null
            ? undefined
            : (params.extraData as Prisma.InputJsonValue),
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });

    return toDomain(created);
  }
}
