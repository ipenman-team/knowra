import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ActivityRepository,
  CreateActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
} from '@contexta/domain';
import { decodeActivityCursor, encodeActivityCursor } from '@contexta/domain';

export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: CreateActivityParams) {
    return await this.prisma.activity.create({
      data: {
        tenantId: params.tenantId,
        action: params.action,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        actorUserId: params.actorUserId,
        occurredAt: params.occurredAt ?? new Date(),
        traceId: params.traceId ?? null,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        metadata: (params.metadata ?? null) as Prisma.InputJsonValue,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });
  }

  async list(params: ListActivitiesParams): Promise<ListActivitiesResult> {
    const limit = Math.min(Math.max(Number(params.limit ?? 50), 1), 200);
    const take = limit + 1;

    const where: Prisma.ActivityWhereInput = {
      tenantId: params.tenantId,
      isDeleted: false,
      actorUserId: params.actorUserId ?? undefined,
      action: params.action ?? undefined,
      subjectType: params.subjectType ?? undefined,
      subjectId: params.subjectId ?? undefined,
      createdAt: {
        gte: params.from ?? undefined,
        lte: params.to ?? undefined,
      },
    };

    const decoded = params.cursor ? decodeActivityCursor(params.cursor) : null;
    if (decoded) {
      where.OR = [
        { createdAt: { lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
      ];
    }

    const rows = await this.prisma.activity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items.at(-1);

    return {
      items,
      hasMore,
      nextCursor: hasMore && last ? encodeActivityCursor(last) : null,
    };
  }
}
