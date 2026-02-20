import type {
  CreateShareSnapshotParams,
  ShareSnapshot,
  ShareRepository,
  ShareSnapshotRepository,
} from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class CreateShareSnapshotUseCase {
  constructor(
    private readonly shareRepo: ShareRepository,
    private readonly snapshotRepo: ShareSnapshotRepository,
  ) {}

  async create(params: CreateShareSnapshotParams): Promise<ShareSnapshot> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const shareId = normalizeRequiredText('shareId', params.shareId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const share = await this.shareRepo.getById({ tenantId, shareId });
    if (!share) throw new Error('share not found');

    return await this.snapshotRepo.create({
      tenantId,
      shareId,
      payload: params.payload,
      actorUserId,
    });
  }
}
