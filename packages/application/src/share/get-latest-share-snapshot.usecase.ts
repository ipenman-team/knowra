import type {
  GetLatestShareSnapshotParams,
  ShareSnapshot,
  ShareSnapshotRepository,
} from '@contexta/domain';
import { normalizeRequiredText } from './utils';

export class GetLatestShareSnapshotUseCase {
  constructor(private readonly snapshotRepo: ShareSnapshotRepository) {}

  async getLatest(
    params: GetLatestShareSnapshotParams,
  ): Promise<ShareSnapshot | null> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const shareId = normalizeRequiredText('shareId', params.shareId);

    return await this.snapshotRepo.getLatestByShareId({ tenantId, shareId });
  }
}
