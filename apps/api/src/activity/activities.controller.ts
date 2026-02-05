import { Controller, Get, Query } from '@nestjs/common';
import { ActivityQueryUseCase } from '@contexta/application';
import { TenantId } from '../common/tenant/tenant-id.decorator';

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

function toOptionalDate(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly queryUseCase: ActivityQueryUseCase) {}

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

    return result;
  }
}
