import type { BillingRepository, TenantEntitlement } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class ListTenantEntitlementsUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async list(params: {
    tenantId: string;
    actorUserId: string;
  }): Promise<TenantEntitlement[]> {
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

    return await this.repo.listActiveEntitlements({
      tenantId,
      at: new Date(),
    });
  }
}
