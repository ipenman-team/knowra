import type { SpaceInvitationRepository } from '@knowra/domain';
import {
  hashInvitationToken,
  normalizeRequiredText,
} from './utils';

export class AcceptSpaceInvitationUseCase {
  constructor(private readonly repo: SpaceInvitationRepository) {}

  async accept(params: {
    token: string;
    actorUserId: string;
  }): Promise<{ tenantId: string; spaceId: string; invitationId: string }> {
    const token = normalizeRequiredText('token', params.token);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const result = await this.repo.acceptInvitationByTokenHash({
      tokenHash: hashInvitationToken(token),
      userId: actorUserId,
      actorId: actorUserId,
      now: new Date(),
    });

    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        throw new Error('invitation not found');
      }
      if (result.reason === 'EXPIRED') {
        throw new Error('invitation expired');
      }
      if (result.reason === 'REVOKED') {
        throw new Error('invitation revoked');
      }
      if (result.reason === 'ALREADY_ACCEPTED') {
        throw new Error('invitation already accepted');
      }
      if (result.reason === 'EMAIL_MISMATCH') {
        throw new Error('invitation email mismatch');
      }
      throw new Error('invitation cannot be accepted');
    }

    return {
      tenantId: result.tenantId,
      spaceId: result.spaceId,
      invitationId: result.invitation.id,
    };
  }
}
