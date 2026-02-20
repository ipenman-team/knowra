import type { SpaceMemberRepository, SpaceRoleRepository } from '@contexta/domain';
import {
  normalizeIds,
  normalizeRequiredText,
  resolveMemberRoleFromSpaceRole,
} from './utils';

export class BatchUpdateMemberRoleUseCase {
  constructor(
    private readonly memberRepo: SpaceMemberRepository,
    private readonly roleRepo: SpaceRoleRepository,
  ) {}

  async update(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    roleId: string;
    actorUserId: string;
  }): Promise<{ ok: true; affected: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const memberIds = normalizeIds(params.memberIds, 'memberIds');
    const roleId = normalizeRequiredText('roleId', params.roleId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.roleRepo.canManageMembers({
      tenantId,
      spaceId,
      userId: actorUserId,
      permission: 'space.member.role_change',
    });
    if (!canManage) throw new Error('permission denied');

    const members = await this.memberRepo.listMembersByIds({
      tenantId,
      spaceId,
      memberIds,
    });

    if (members.length !== memberIds.length) throw new Error('member not found');
    if (members.some((member) => member.role === 'OWNER')) {
      throw new Error('owner member cannot be modified');
    }

    const targetRole = await this.roleRepo.getRoleById({
      tenantId,
      spaceId,
      roleId,
    });
    if (!targetRole) throw new Error('role not found');

    const role = resolveMemberRoleFromSpaceRole(targetRole);

    const affected = await this.memberRepo.updateMembersRole({
      tenantId,
      spaceId,
      memberIds,
      role,
      spaceRoleId: targetRole.id,
      actorId: actorUserId,
    });

    return { ok: true, affected };
  }
}
