import type { BillingBillsResult, BillingRepository } from '@knowra/domain';
import { clampPagination, normalizeRequiredText } from './utils';

export class ListBillingBillsUseCase {
  constructor(private readonly repo: BillingRepository) {}

  async list(params: {
    tenantId: string;
    actorUserId: string;
    skip?: number | null;
    take?: number | null;
  }): Promise<BillingBillsResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText(
      'actorUserId',
      params.actorUserId,
    );
    const { skip, take } = clampPagination(params.skip, params.take);

    const hasPermission = await this.repo.hasBillingPermission({
      tenantId,
      userId: actorUserId,
    });
    if (!hasPermission) throw new Error('permission denied');

    return await this.repo.listBills({ tenantId, skip, take });
  }
}
