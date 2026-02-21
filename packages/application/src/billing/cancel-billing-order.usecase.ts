import type { BillingOrderDetail, BillingRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

function ensureCancelable(status: string): void {
  if (status === 'PAID') throw new Error('paid order cannot be cancelled');
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    throw new Error('order already closed');
  }
}

export class CancelBillingOrderUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async cancel(params: {
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

    ensureCancelable(detail.order.status);

    const updated = await this.repo.cancelOrder({
      tenantId,
      orderId,
      actorUserId,
      cancelledAt: new Date(),
    });

    if (!updated) throw new Error('order not found');
    return updated;
  }
}
