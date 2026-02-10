import { Share, ShareRepository } from '@contexta/domain';

export type GetShareByIdParams = {
  tenantId: string;
  shareId: string;
};

export type GetShareByTargetIdParams = {
  tenantId: string;
  targetId: string;
};

export class GetShareByIdUseCase {
  constructor(private readonly shareRepo: ShareRepository) {}

  async get(params: GetShareByIdParams): Promise<Share | null> {
    const { tenantId, shareId } = params;
    return this.shareRepo.getById({ tenantId, shareId });
  }

  async getByTargetId(params: GetShareByTargetIdParams): Promise<Share | null> {
    const { tenantId, targetId } = params;
    return this.shareRepo.getByTargetId({ tenantId, targetId });
  }
}
