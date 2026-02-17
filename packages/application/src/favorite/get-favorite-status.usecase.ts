import type { FavoriteRepository } from '@contexta/domain';
import { normalizeRequiredText, normalizeTargetType } from './utils';

export class GetFavoriteStatusUseCase {
  constructor(private readonly repo: FavoriteRepository) {}

  async getStatus(params: {
    tenantId: string;
    userId: string;
    targetType: string;
    targetId: string;
  }): Promise<{ favorite: boolean }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const targetType = normalizeTargetType(params.targetType);
    const targetId = normalizeRequiredText('targetId', params.targetId);

    const found = await this.repo.get({
      tenantId,
      userId,
      targetType,
      targetId,
    });

    return { favorite: Boolean(found) };
  }
}
