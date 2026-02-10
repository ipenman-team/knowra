import { Share, ShareRepository } from '@contexta/domain';

export type GetShareByIdParams = {
  tenantId: string;
  shareId: string;
};

export class GetShareByIdUseCase {
  constructor(private readonly shareRepo: ShareRepository) {}

  async get(params: GetShareByIdParams): Promise<Share | null> {
    const { tenantId, shareId } = params;
    return this.shareRepo.getById({ tenantId, shareId });
  }
}
