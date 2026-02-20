import type {
  ActivityDailyStatsParams,
  ActivityDailyStatsResult,
  ActivityRepository,
  ListActivitiesParams,
  ListActivitiesResult,
} from '@knowra/domain';

function clampLimit(raw: unknown): number {
  const n = Number(raw ?? 50);
  if (!Number.isFinite(n)) return 50;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}

export class ActivityQueryUseCase {
  constructor(private readonly repo: ActivityRepository) {}

  async list(params: ListActivitiesParams): Promise<ListActivitiesResult> {
    if (!params.tenantId) throw new Error('tenantId is required');

    const limit = clampLimit(params.limit);

    return await this.repo.list({
      ...params,
      tenantId: params.tenantId,
      limit,
      cursor: params.cursor ?? null,
      actorUserId: params.actorUserId ?? null,
      action: params.action ?? null,
      subjectType: params.subjectType ?? null,
      subjectId: params.subjectId ?? null,
      from: params.from ?? null,
      to: params.to ?? null,
    });
  }

  async dailyStats(
    params: ActivityDailyStatsParams,
  ): Promise<ActivityDailyStatsResult> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.from) throw new Error('from is required');
    if (!params.to) throw new Error('to is required');

    return await this.repo.dailyStats({
      ...params,
      tenantId: params.tenantId,
      actorUserId: params.actorUserId ?? null,
      action: params.action ?? null,
      subjectType: params.subjectType ?? null,
      subjectId: params.subjectId ?? null,
    });
  }
}
