import type { SpaceMemberRepository, SpaceRoleRepository } from '@contexta/domain';
import { normalizeIds, normalizeRequiredText } from './utils';

export class BatchRemoveMembersUseCase {
  constructor(
    private readonly memberRepo: SpaceMemberRepository,
    private readonly roleRepo: SpaceRoleRepository,
  ) {}

  async remove(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    actorUserId: string;
  }): Promise<{ ok: true; affected: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const memberIds = normalizeIds(params.memberIds, 'memberIds');
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.roleRepo.canManageMembers({
      tenantId,
      spaceId,
      userId: actorUserId,
      permission: 'space.member.remove',
    });
    if (!canManage) throw new Error('permission denied');

    const members = await this.memberRepo.listMembersByIds({
      tenantId,
      spaceId,
      memberIds,
    });
    if (members.length !== memberIds.length) throw new Error('member not found');

    if (members.some((member) => member.role === 'OWNER')) {
      throw new Error('owner member cannot be removed');
    }

    const affected = await this.memberRepo.removeMembers({
      tenantId,
      spaceId,
      memberIds,
      actorId: actorUserId,
    });

    return { ok: true, affected };
  }
}
