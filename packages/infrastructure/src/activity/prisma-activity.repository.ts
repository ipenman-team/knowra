import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  ActivityRepository,
  ActivityDailyStatsParams,
  ActivityDailyStatsResult,
  CreateActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
} from '@knowra/domain';
import { decodeActivityCursor, encodeActivityCursor } from '@knowra/domain';

function toUtcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

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

  async dailyStats(
    params: ActivityDailyStatsParams,
  ): Promise<ActivityDailyStatsResult> {
    const from = toUtcStartOfDay(params.from);
    const toExclusive = addUtcDays(toUtcStartOfDay(params.to), 1);

    const where = Prisma.sql`
      "tenant_id" = ${params.tenantId}
      AND "is_deleted" = false
      AND "created_at" >= ${from}
      AND "created_at" < ${toExclusive}
      ${params.actorUserId
        ? Prisma.sql`AND "actor_user_id" = ${params.actorUserId}`
        : Prisma.empty}
      ${params.action ? Prisma.sql`AND "action" = ${params.action}` : Prisma.empty}
      ${params.subjectType
        ? Prisma.sql`AND "subject_type" = ${params.subjectType}`
        : Prisma.empty}
      ${params.subjectId
        ? Prisma.sql`AND "subject_id" = ${params.subjectId}`
        : Prisma.empty}
    `;

    const rows = await this.prisma.$queryRaw<
      Array<{ date: string; count: number }>
    >(Prisma.sql`
      SELECT
        to_char(("created_at" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "count"
      FROM "activities"
      WHERE ${where}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    return {
      items: rows.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  }
}
