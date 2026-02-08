import type { DailyCopyRepository } from '@contexta/domain';
import { formatLocalDayKey, normalizeRequiredText } from './utils';

export class GetTodayDailyCopyUseCase {
  constructor(private readonly repo: DailyCopyRepository) {}

  async getToday(params: { tenantId: string; userId: string; now?: Date | null }) {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const now = params.now ?? new Date();
    const day = formatLocalDayKey(now);

    return await this.repo.findByDay({ tenantId, userId, day });
  }
}
