import type { SpaceMemberRepository, SpaceRoleRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class RemoveMemberUseCase {
  constructor(
    private readonly memberRepo: SpaceMemberRepository,
    private readonly roleRepo: SpaceRoleRepository,
  ) {}

  async remove(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    actorUserId: string;
  }): Promise<{ ok: true }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const memberId = normalizeRequiredText('memberId', params.memberId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.roleRepo.canManageMembers({
      tenantId,
      spaceId,
      userId: actorUserId,
      permission: 'space.member.remove',
    });
    if (!canManage) throw new Error('permission denied');

    const member = await this.memberRepo.getMemberById({
      tenantId,
      spaceId,
      memberId,
    });
    if (!member) throw new Error('member not found');
    if (member.role === 'OWNER') throw new Error('owner member cannot be removed');

    const removed = await this.memberRepo.removeMember({
      tenantId,
      spaceId,
      memberId,
      actorId: actorUserId,
    });

    if (!removed) throw new Error('member not found');

    return { ok: true };
  }
}
