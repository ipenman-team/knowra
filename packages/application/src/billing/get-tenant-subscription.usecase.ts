import type { BillingRepository, TenantSubscription } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class GetTenantSubscriptionUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async get(params: {
    tenantId: string;
    actorUserId: string;
  }): Promise<TenantSubscription | null> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText(
      'actorUserId',
      params.actorUserId,
    );

    const hasPermission = await this.repo.hasBillingPermission({
      tenantId,
      userId: actorUserId,
    });
    if (!hasPermission) throw new Error('permission denied');

    return await this.repo.getSubscription({ tenantId });
  }
}
