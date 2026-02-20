import type { Activity, ActivityRepository, CreateActivityParams } from '@knowra/domain';

function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const v = raw.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export class ActivityRecorderUseCase {
  constructor(private readonly repo: ActivityRepository) {}

  async record(params: CreateActivityParams): Promise<Activity> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const action = normalizeRequiredText('action', params.action);
    const subjectType = normalizeRequiredText('subjectType', params.subjectType);
    const subjectId = normalizeRequiredText('subjectId', params.subjectId);

    const occurredAt = params.occurredAt ?? new Date();

    return await this.repo.create({
      tenantId,
      actorUserId,
      action,
      subjectType,
      subjectId,
      occurredAt,
      metadata: params.metadata ?? null,
      traceId: params.traceId ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
  }
}
