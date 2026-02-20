import type { SpaceMemberRepository, SpaceRoleRepository } from '@knowra/domain';
import {
  normalizeRequiredText,
  resolveMemberRoleFromSpaceRole,
} from './utils';

export class UpdateMemberRoleUseCase {
  constructor(
    private readonly memberRepo: SpaceMemberRepository,
    private readonly roleRepo: SpaceRoleRepository,
  ) {}

  async update(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    roleId: string;
    actorUserId: string;
  }): Promise<{ ok: true }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const memberId = normalizeRequiredText('memberId', params.memberId);
    const roleId = normalizeRequiredText('roleId', params.roleId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.roleRepo.canManageMembers({
      tenantId,
      spaceId,
      userId: actorUserId,
      permission: 'space.member.role_change',
    });
    if (!canManage) throw new Error('permission denied');

    const member = await this.memberRepo.getMemberById({
      tenantId,
      spaceId,
      memberId,
    });
    if (!member) throw new Error('member not found');
    if (member.role === 'OWNER') throw new Error('owner member cannot be modified');

    const targetRole = await this.roleRepo.getRoleById({
      tenantId,
      spaceId,
      roleId,
    });
    if (!targetRole) throw new Error('role not found');

    const role = resolveMemberRoleFromSpaceRole(targetRole);

    const updated = await this.memberRepo.updateMemberRole({
      tenantId,
      spaceId,
      memberId,
      role,
      spaceRoleId: targetRole.id,
      actorId: actorUserId,
    });

    if (!updated) throw new Error('member not found');

    return { ok: true };
  }
}
