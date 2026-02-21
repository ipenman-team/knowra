import type { BillingBill, BillingRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class GetBillingBillUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async get(params: {
    tenantId: string;
    actorUserId: string;
    billId: string;
  }): Promise<BillingBill> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText(
      'actorUserId',
      params.actorUserId,
    );
    const billId = normalizeRequiredText('billId', params.billId);

    const hasPermission = await this.repo.hasBillingPermission({
      tenantId,
      userId: actorUserId,
    });
    if (!hasPermission) throw new Error('permission denied');

    const bill = await this.repo.getBill({ tenantId, billId });
    if (!bill) throw new Error('bill not found');

    return bill;
  }
}
