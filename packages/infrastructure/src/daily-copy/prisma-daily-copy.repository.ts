import type { PrismaClient } from '@prisma/client';
import type {
  CreateDailyCopyParams,
  DailyCopyRepository,
  FindDailyCopyParams,
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
        expiresAt: params.expiresAt,
        createdBy: params.userId,
        updatedBy: params.userId,
      },
    });
  }
}
