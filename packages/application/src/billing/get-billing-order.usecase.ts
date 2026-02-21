import type { BillingOrderDetail, BillingRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class GetBillingOrderUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async get(params: {
    tenantId: string;
    actorUserId: string;
    orderId: string;
  }): Promise<BillingOrderDetail> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText(
      'actorUserId',
      params.actorUserId,
    );
    const orderId = normalizeRequiredText('orderId', params.orderId);

    const hasPermission = await this.repo.hasBillingPermission({
      tenantId,
      userId: actorUserId,
    });
    if (!hasPermission) throw new Error('permission denied');

    const detail = await this.repo.getOrderDetail({ tenantId, orderId });
    if (!detail) throw new Error('order not found');

    return detail;
  }
}
