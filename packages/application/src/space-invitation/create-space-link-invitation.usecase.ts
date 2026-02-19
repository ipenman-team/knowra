import type {
  SpaceInvitationRepository,
  SpaceInvitationWithToken,
} from '@contexta/domain';
import {
  buildInvitationUrl,
  createInvitationToken,
  getInvitationExpiresAt,
  hashInvitationToken,
  normalizeInvitationRole,
  normalizeRequiredText,
} from './utils';

export class CreateSpaceLinkInvitationUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async create(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    role?: string;
  }): Promise<SpaceInvitationWithToken> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const role = normalizeInvitationRole(params.role ?? 'MEMBER');

    const canManage = await this.repo.canManageSpaceInvitations({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    const inviteToken = createInvitationToken();
    const tokenHash = hashInvitationToken(inviteToken);
    const inviteUrl = buildInvitationUrl(inviteToken);

    const [invitation] = await this.repo.createInvitations({
      tenantId,
      spaceId,
      inviterUserId: actorUserId,
      actorId: actorUserId,
      expiresAt: getInvitationExpiresAt(new Date()),
      records: [
        {
          inviteeEmail: null,
          role,
          channel: 'LINK',
          tokenHash,
        },
      ],
    });

    if (!invitation) {
      throw new Error('failed to create invitation');
    }

    return {
      invitation,
      inviteToken,
      inviteUrl,
    };
  }
}
