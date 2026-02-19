import type {
  SpaceInvitationRepository,
  SpaceInvitationWithToken,
} from '@contexta/domain';
import {
  buildInvitationUrl,
  createInvitationToken,
  getInvitationExpiresAt,
  hashInvitationToken,
  normalizeEmails,
  normalizeInvitationRole,
  normalizeRequiredText,
} from './utils';

export class CreateSpaceEmailInvitationsUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async create(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    emails: string[];
    role?: string;
  }): Promise<SpaceInvitationWithToken[]> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const emails = normalizeEmails(params.emails);
    const role = normalizeInvitationRole(params.role ?? 'MEMBER');

    const canManage = await this.repo.canManageSpaceInvitations({
      tenantId,
      spaceId,
      userId: actorUserId,
    });
    if (!canManage) throw new Error('permission denied');

    const now = new Date();
    const expiresAt = getInvitationExpiresAt(now);

    const drafts = emails.map((email) => {
      const inviteToken = createInvitationToken();
      const tokenHash = hashInvitationToken(inviteToken);
      return {
        email,
        inviteToken,
        tokenHash,
        inviteUrl: buildInvitationUrl(inviteToken),
      };
    });

    const created = await this.repo.createInvitations({
      tenantId,
      spaceId,
      inviterUserId: actorUserId,
      actorId: actorUserId,
      expiresAt,
      records: drafts.map((item) => ({
        inviteeEmail: item.email,
        role,
        channel: 'EMAIL',
        tokenHash: item.tokenHash,
      })),
    });

    const tokenByHash = new Map(
      drafts.map((item) => [
        item.tokenHash,
        { inviteToken: item.inviteToken, inviteUrl: item.inviteUrl },
      ]),
    );

    return created
      .map((invitation) => {
        const token = tokenByHash.get(invitation.tokenHash);
        if (!token) return null;
        return {
          invitation,
          inviteToken: token.inviteToken,
          inviteUrl: token.inviteUrl,
        };
      })
      .filter((item): item is SpaceInvitationWithToken => Boolean(item));
  }
}
