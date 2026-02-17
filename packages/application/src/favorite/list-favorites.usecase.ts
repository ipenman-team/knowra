import type { FavoriteRepository, ListFavoritesResult } from '@contexta/domain';
import {
  normalizePositiveInteger,
  normalizeRequiredText,
  normalizeTargetType,
} from './utils';

export class ListFavoritesUseCase {
  constructor(private readonly repo: FavoriteRepository) {}

  async list(params: {
    tenantId: string;
    userId: string;
    targetType?: string | null;
    targetIds?: string[] | null;
    skip?: number | null;
    take?: number | null;
  }): Promise<ListFavoritesResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);

    const targetType =
      typeof params.targetType === 'string' && params.targetType.trim()
        ? normalizeTargetType(params.targetType)
        : null;

    const targetIds = Array.isArray(params.targetIds)
      ? params.targetIds
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter((id) => Boolean(id))
      : [];

    return await this.repo.list({
      tenantId,
      userId,
      targetType,
      targetIds: targetIds.length > 0 ? [...new Set(targetIds)] : null,
      skip: normalizePositiveInteger(params.skip, 0, 0, 10_000),
      take: normalizePositiveInteger(params.take, 100, 1, 200),
    });
  }
}
