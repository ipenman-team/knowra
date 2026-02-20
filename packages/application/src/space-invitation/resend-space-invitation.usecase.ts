import type {
  SpaceInvitationRepository,
  SpaceInvitationWithToken,
} from '@knowra/domain';
import {
  SpaceInvitationStatus,
} from '@knowra/domain';
import {
  buildInvitationUrl,
  createInvitationToken,
  getInvitationExpiresAt,
  hashInvitationToken,
  normalizeRequiredText,
} from './utils';

export class ResendSpaceInvitationUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async resend(params: {
    tenantId: string;
    spaceId: string;
    invitationId: string;
    actorUserId: string;
  }): Promise<SpaceInvitationWithToken> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const invitationId = normalizeRequiredText(
      'invitationId',
      params.invitationId,
    );
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const canManage = await this.repo.canManageSpaceInvitations({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    const now = new Date();
    const target = await this.repo.getInvitationById({
      tenantId,
      spaceId,
      invitationId,
      now,
    });

    if (!target) throw new Error('invitation not found');
    if (target.status === SpaceInvitationStatus.Accepted) {
      throw new Error('invitation already accepted');
    }
    if (target.status === SpaceInvitationStatus.Revoked) {
      throw new Error('invitation revoked');
    }

    const inviteToken = createInvitationToken();
    const tokenHash = hashInvitationToken(inviteToken);
    const inviteUrl = buildInvitationUrl(inviteToken);

    const invitation = await this.repo.resendInvitation({
      tenantId,
      spaceId,
      invitationId,
      tokenHash,
      expiresAt: getInvitationExpiresAt(now),
      actorId: actorUserId,
      now,
    });

    if (!invitation) throw new Error('invitation not found');

    return {
      invitation,
      inviteToken,
      inviteUrl,
    };
  }
}
