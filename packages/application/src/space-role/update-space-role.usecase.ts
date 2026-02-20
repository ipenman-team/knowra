import type { SpaceRole, SpaceRoleRepository } from '@knowra/domain';
import {
  normalizeOptionalText,
  normalizePermissionKeys,
  normalizeRequiredText,
} from './utils';

export class UpdateSpaceRoleUseCase {
  constructor(private readonly repo: SpaceRoleRepository) {}

  async update(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    actorUserId: string;
    name?: string;
    description?: string | null;
    permissions?: string[];
  }): Promise<SpaceRole> {
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

    if (existing.isBuiltIn && existing.builtInType === 'OWNER') {
      throw new Error('owner role cannot be modified');
    }

    if (
      existing.isBuiltIn &&
      existing.builtInType !== 'OWNER' &&
      (params.name !== undefined || params.description !== undefined)
    ) {
      throw new Error('built-in role name and description are read-only');
    }

    const nextName =
      params.name === undefined ? undefined : normalizeRequiredText('name', params.name);
    const nextDescription =
      params.description === undefined
        ? undefined
        : normalizeOptionalText(params.description);
    const nextPermissions =
      params.permissions === undefined
        ? undefined
        : normalizePermissionKeys(params.permissions);

    const updated = await this.repo.updateRole({
      tenantId,
      spaceId,
      roleId,
      name: nextName,
      description: nextDescription,
      permissions: nextPermissions,
      actorId: actorUserId,
    });

    if (!updated) throw new Error('role not found');
    return updated;
  }
}
