import type { SpaceRole, SpaceRoleRepository } from '@contexta/domain';
import {
  normalizeOptionalText,
  normalizePermissionKeys,
  normalizeRequiredText,
} from './utils';

export class CreateSpaceRoleUseCase {
  constructor(private readonly repo: SpaceRoleRepository) {}

  async create(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    name: string;
    description?: string | null;
    permissions: string[];
  }): Promise<SpaceRole> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const name = normalizeRequiredText('name', params.name);
    const description = normalizeOptionalText(params.description);
    const permissions = normalizePermissionKeys(params.permissions);

    const canManage = await this.repo.canManageRoles({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    await this.repo.ensureBuiltInRoles({
      tenantId,
      spaceId,
      actorId: actorUserId,
    });

    return await this.repo.createRole({
      tenantId,
      spaceId,
      name,
      description,
      permissions,
      actorId: actorUserId,
    });
  }
}
