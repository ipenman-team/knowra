import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  DeleteFavoriteParams,
  FavoriteRepository,
  GetFavoriteParams,
  ListFavoritesParams,
  ListFavoritesResult,
  UpsertFavoriteParams,
} from '@contexta/domain';

export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(params: UpsertFavoriteParams) {
    return await this.prisma.favorite.upsert({
      where: {
        tenantId_userId_targetType_targetId: {
          tenantId: params.tenantId,
          userId: params.userId,
          targetType: params.targetType,
          targetId: params.targetId,
        },
      },
      update: {
        isDeleted: false,
        extraData:
          params.extraData === undefined
            ? undefined
            : (params.extraData as Prisma.InputJsonValue),
        updatedBy: params.userId,
      },
      create: {
        tenantId: params.tenantId,
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        extraData:
          params.extraData === undefined
            ? undefined
            : (params.extraData as Prisma.InputJsonValue),
        createdBy: params.userId,
        updatedBy: params.userId,
      },
    });
  }

  async softDelete(params: DeleteFavoriteParams) {
    await this.prisma.favorite.updateMany({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        updatedBy: params.userId,
      },
    });
  }

  async get(params: GetFavoriteParams) {
    return await this.prisma.favorite.findFirst({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        isDeleted: false,
      },
    });
  }

  async list(params: ListFavoritesParams): Promise<ListFavoritesResult> {
    const where: Prisma.FavoriteWhereInput = {
      tenantId: params.tenantId,
      userId: params.userId,
      isDeleted: false,
      targetType: params.targetType ?? undefined,
      targetId:
        params.targetIds && params.targetIds.length > 0
          ? { in: params.targetIds }
          : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 100,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.favorite.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }
}
