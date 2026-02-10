import type { Share, ShareRepository, ShareStatus } from '@contexta/domain';
import { normalizeRequiredText } from './utils';

export class UpdateShareStatusUseCase {
  constructor(private readonly repo: ShareRepository) {}

  async update(params: {
    tenantId: string;
    shareId: string;
    status: ShareStatus;
    actorUserId: string;
  }): Promise<Share> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const shareId = normalizeRequiredText('shareId', params.shareId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    if (!params.status) throw new Error('status is required');

    return await this.repo.updateStatus({
      tenantId,
      shareId,
      status: params.status,
      actorUserId,
    });
  }
}
