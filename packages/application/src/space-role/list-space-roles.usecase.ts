import type { SpaceRole, SpaceRoleRepository } from '@contexta/domain';
import { normalizeRequiredText } from './utils';

export class ListSpaceRolesUseCase {
  constructor(private readonly repo: SpaceRoleRepository) {}

  async list(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
  }): Promise<SpaceRole[]> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

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

    return await this.repo.listRoles({ tenantId, spaceId });
  }
}
