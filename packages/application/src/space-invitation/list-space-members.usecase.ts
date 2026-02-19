import type { SpaceInvitationRepository, SpaceMember } from '@contexta/domain';
import { normalizeRequiredText } from './utils';

export class ListSpaceMembersUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async list(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
  }): Promise<SpaceMember[]> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.repo.canManageSpaceInvitations({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    return await this.repo.listMembers({ tenantId, spaceId });
  }
}
