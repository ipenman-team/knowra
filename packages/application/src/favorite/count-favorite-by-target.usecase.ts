import type { FavoriteRepository } from '@contexta/domain';
import { normalizeRequiredText, normalizeTargetType } from './utils';

export class CountFavoriteByTargetUseCase {
  constructor(private readonly repo: FavoriteRepository) {}

  async count(params: {
    tenantId: string;
    targetType: string;
    targetId: string;
  }): Promise<{ count: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const targetType = normalizeTargetType(params.targetType);
    const targetId = normalizeRequiredText('targetId', params.targetId);

    const count = await this.repo.countByTarget({
      tenantId,
      targetType,
      targetId,
    });

    return { count };
  }
}
