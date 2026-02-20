import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateShareParams,
  ListSharesParams,
  ListSharesResult,
  Share,
  ShareRepository,
  UpdateShareStatusParams,
} from '@knowra/domain';
import { GetShareByTargetIdParams } from 'packages/domain/src/share/types';

function toDomain(row: {
  scopeType?: string | null;
  scopeId?: string | null;
  id: string;
  tenantId: string;
  type: string;
  targetId: string;
  status: string;
  visibility: string;
  publicId: string;
  tokenHash: string | null;
  expiresAt: Date | null;
  passwordHash: string | null;
  extraData: Prisma.JsonValue | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Share {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type as Share['type'],
    targetId: row.targetId,
    status: row.status as Share['status'],
    visibility: row.visibility as Share['visibility'],
    publicId: row.publicId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    passwordHash: row.passwordHash,
    extraData: row.extraData,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaShareRepository implements ShareRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async getByTargetId(params: GetShareByTargetIdParams): Promise<Share | null> {
    const row = await this.prisma.externalShare.findFirst({
      where: {
        tenantId: params.tenantId,
        targetId: params.targetId,
        isDeleted: false,
      },
    });

    return row ? toDomain(row) : null;
  }

  async create(params: CreateShareParams): Promise<Share> {
    const created = await this.prisma.externalShare.create({
      data: {
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        tenantId: params.tenantId,
        type: params.type,
        targetId: params.targetId,
        status: params.status,
        visibility: params.visibility,
        publicId: params.publicId,
        tokenHash: params.tokenHash ?? null,
        expiresAt: params.expiresAt ?? null,
        passwordHash: params.passwordHash ?? null,
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

  async getById(params: { tenantId: string; shareId: string }): Promise<Share | null> {
    const row = await this.prisma.externalShare.findFirst({
      where: {
        id: params.shareId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
    });

    return row ? toDomain(row) : null;
  }

  async getByPublicId(params: { publicId: string }): Promise<Share | null> {
    const row = await this.prisma.externalShare.findFirst({
      where: {
        publicId: params.publicId,
        isDeleted: false,
      },
    });

    return row ? toDomain(row) : null;
  }

  async list(params: ListSharesParams): Promise<ListSharesResult> {
    const where: Prisma.ExternalShareWhereInput = {
      tenantId: params.tenantId,
      isDeleted: false,
      type: params.type ?? undefined,
      targetId: params.targetId ?? undefined,
      status: params.status ?? undefined,
      visibility: params.visibility ?? undefined,
      createdBy: params.createdBy ?? undefined,
    };

    if (params.spaceId) {
      const pages = await this.prisma.page.findMany({
        where: {
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          isDeleted: false,
        },
        select: { id: true },
      });
      const pageIds = pages.map((p) => p.id);
      where.targetId = { in: pageIds };
      if (!params.type) {
        where.type = 'PAGE';
      }
    }

    const skip = Math.max(Number(params.skip ?? 0), 0);
    const take = Math.max(Number(params.take ?? 50), 1);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.externalShare.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.externalShare.count({ where }),
    ]);

    return {
      items: rows.map(toDomain),
      total,
    };
  }

  async updateStatus(params: UpdateShareStatusParams): Promise<Share> {
    await this.prisma.externalShare.updateMany({
      where: {
        id: params.shareId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      data: {
        status: params.status,
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      },
    });

    const updated = await this.getById({
      tenantId: params.tenantId,
      shareId: params.shareId,
    });

    if (!updated) throw new Error('share not found');
    return updated;
  }
}
