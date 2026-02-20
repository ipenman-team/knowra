import type { DailyCopyMetadata, DailyCopyRepository } from '@knowra/domain';
import { formatLocalDayKey, normalizeRequiredText } from './utils';

export class SetTodayDailyCopyLikeUseCase {
  constructor(private readonly repo: DailyCopyRepository) {}

  async setLike(params: {
    tenantId: string;
    userId: string;
    liked: boolean;
    now?: Date | null;
  }) {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const now = params.now ?? new Date();
    const day = formatLocalDayKey(now);

    const existing = await this.repo.findByDay({ tenantId, userId, day });
    if (!existing) return null;

    const base =
      existing.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    const metadata: DailyCopyMetadata = {
      ...base,
      liked: params.liked,
    };

    return await this.repo.updateMetadata({
      tenantId,
      userId,
      day,
      metadata,
    });
  }
}
