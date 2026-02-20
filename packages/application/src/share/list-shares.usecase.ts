import type { ListSharesParams, ListSharesResult, ShareRepository } from '@knowra/domain';
import { clampNumber, normalizeRequiredText } from './utils';

export class ListSharesUseCase {
  constructor(private readonly repo: ShareRepository) { }

  async list(params: ListSharesParams): Promise<ListSharesResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const take = clampNumber(params.take, 1, 200, 50);
    const skip = clampNumber(params.skip, 0, 100000, 0);

    return await this.repo.list({
      tenantId,
      type: params.type ?? null,
      targetId: params.targetId ?? null,
      status: params.status ?? null,
      visibility: params.visibility ?? null,
      scopeId: params.scopeId ?? null,
      scopeType: params.scopeType ?? null,
      createdBy: params.createdBy ?? null,
      skip,
      take,
    });
  }
}
