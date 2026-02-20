import type {
  SpaceInvitation,
  SpaceInvitationRepository,
  SpaceInvitationStatusValue,
} from '@knowra/domain';
import {
  normalizeInvitationStatuses,
  normalizeRequiredText,
} from './utils';

export class ListSpaceInvitationsUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async list(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    statuses?: SpaceInvitationStatusValue[];
  }): Promise<SpaceInvitation[]> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const statuses = normalizeInvitationStatuses(params.statuses ?? null);

    const canManage = await this.repo.canManageSpaceInvitations({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    return await this.repo.listInvitations({
      tenantId,
      spaceId,
      statuses,
      now: new Date(),
    });
  }
}
