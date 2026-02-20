import type { SpaceRoleRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class DeleteSpaceRoleUseCase {
  constructor(private readonly repo: SpaceRoleRepository) {}

  async delete(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    actorUserId: string;
  }): Promise<{
    ok: true;
    downgradedMemberCount: number;
    downgradedInvitationCount: number;
  }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const roleId = normalizeRequiredText('roleId', params.roleId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.repo.canManageRoles({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    const existing = await this.repo.getRoleById({ tenantId, spaceId, roleId });
    if (!existing) throw new Error('role not found');
    if (existing.isBuiltIn) throw new Error('built-in role cannot be deleted');

    const memberBuiltInRole = await this.repo.getBuiltInRole({
      tenantId,
      spaceId,
      builtInType: 'MEMBER',
    });
    if (!memberBuiltInRole) {
      throw new Error('member built-in role not found');
    }

    const deleted = await this.repo.deleteRole({
      tenantId,
      spaceId,
      roleId,
      fallbackRoleId: memberBuiltInRole.id,
      actorId: actorUserId,
    });

    if (!deleted.deleted) throw new Error('role not found');

    return {
      ok: true,
      downgradedMemberCount: deleted.downgradedMemberCount,
      downgradedInvitationCount: deleted.downgradedInvitationCount,
    };
  }
}
