import type { FavoriteExtraData, FavoriteRepository } from '@knowra/domain';
import { normalizeRequiredText, normalizeTargetType } from './utils';

export class SetFavoriteUseCase {
  constructor(private readonly repo: FavoriteRepository) {}

  async set(params: {
    tenantId: string;
    userId: string;
    targetType: string;
    targetId: string;
    favorite: boolean;
    extraData?: FavoriteExtraData | null;
  }): Promise<{ favorite: boolean }> {
    if (typeof params.favorite !== 'boolean') {
      throw new Error('favorite must be boolean');
    }

    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const targetType = normalizeTargetType(params.targetType);
    const targetId = normalizeRequiredText('targetId', params.targetId);

    if (params.favorite) {
      await this.repo.upsert({
        tenantId,
        userId,
        targetType,
        targetId,
        extraData: params.extraData ?? null,
      });
    } else {
      await this.repo.softDelete({
        tenantId,
        userId,
        targetType,
        targetId,
      });
    }

    return { favorite: params.favorite };
  }
}
