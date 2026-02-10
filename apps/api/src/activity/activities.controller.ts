import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { ActivityQueryUseCase } from '@contexta/application';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { ACTIVITY_ACTION_NAME_MAP } from './activity.tokens';
import { formatActivityContent } from './activity-content';
import { ListResponse, Response } from '@contexta/shared';

type ListActivitiesQuery = {
  limit?: string;
  cursor?: string;
  actorUserId?: string;
  action?: string;
  subjectType?: string;
  subjectId?: string;
  from?: string;
  to?: string;
};

type DailyStatsQuery = {
  from?: string; // ISO date
  to?: string; // ISO date
  actorUserId?: string;
  action?: string;
  subjectType?: string;
  subjectId?: string;
};

function toOptionalDate(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseRequiredIsoDateOnly(name: string, raw: unknown): Date {
  if (typeof raw !== 'string') throw new BadRequestException(`${name} is required`);
  const v = raw.trim();
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(v);
  if (!m) throw new BadRequestException(`${name} must be ISO date (YYYY-MM-DD)`);

  const [y, mo, d] = v.split('-').map((x) => Number(x));
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${name} must be ISO date (YYYY-MM-DD)`);
  }
  return date;
}

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly queryUseCase: ActivityQueryUseCase,
    @Inject(ACTIVITY_ACTION_NAME_MAP)
    private readonly actionNameMap: Record<string, string>,
  ) {}

  @Get()
  async list(@TenantId() tenantId: string, @Query() query: ListActivitiesQuery) {
    const result = await this.queryUseCase.list({
      tenantId,
      limit: query.limit ? Number(query.limit) : undefined,
      cursor: query.cursor ?? null,
      actorUserId: query.actorUserId ?? null,
      action: query.action ?? null,
      subjectType: query.subjectType ?? null,
      subjectId: query.subjectId ?? null,
      from: toOptionalDate(query.from),
      to: toOptionalDate(query.to),
    });

    return new ListResponse(
      result.items.map((it) => ({
        ...it,
        actionName: this.actionNameMap[it.action] ?? null,
        content: formatActivityContent(it),
      })),
      undefined,
      {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    );
  }

  @Get('stats/daily')
  async dailyStats(
    @TenantId() tenantId: string,
    @Query() query: DailyStatsQuery,
  ) {
    const from = parseRequiredIsoDateOnly('from', query.from);
    const to = parseRequiredIsoDateOnly('to', query.to);

    return new Response(
      await this.queryUseCase.dailyStats({
        tenantId,
        from,
        to,
        actorUserId: query.actorUserId ?? null,
        action: query.action ?? null,
        subjectType: query.subjectType ?? null,
        subjectId: query.subjectId ?? null,
      }),
    );
  }
}
