import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateDailyCopyParams,
  DailyCopyRepository,
  FindDailyCopyParams,
  UpdateDailyCopyMetadataParams,
} from '@contexta/domain';

export class PrismaDailyCopyRepository implements DailyCopyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDay(params: FindDailyCopyParams) {
    return await this.prisma.dailyCopy.findFirst({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        day: params.day,
        isDeleted: false,
      },
    });
  }

  async create(params: CreateDailyCopyParams) {
    return await this.prisma.dailyCopy.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        day: params.day,
        category: params.category,
        content: params.content,
        metadata:
          params.metadata == null
            ? undefined
            : (params.metadata as Prisma.InputJsonValue),
        expiresAt: params.expiresAt,
        createdBy: params.userId,
        updatedBy: params.userId,
      },
    });
  }

  async updateMetadata(params: UpdateDailyCopyMetadataParams) {
    return await this.prisma.dailyCopy.update({
      where: {
        tenantId_userId_day: {
          tenantId: params.tenantId,
          userId: params.userId,
          day: params.day,
        },
      },
      data: {
        metadata:
          params.metadata == null
            ? undefined
            : (params.metadata as Prisma.InputJsonValue),
        updatedBy: params.userId,
      },
    });
  }
}
