export const SpaceInvitationStatus = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Expired: 'EXPIRED',
  Revoked: 'REVOKED',
} as const;

export const SpaceInvitationChannel = {
  Email: 'EMAIL',
  Link: 'LINK',
} as const;

export const SpaceMemberRole = {
  Owner: 'OWNER',
  Admin: 'ADMIN',
  Member: 'MEMBER',
} as const;

export const TenantRole = {
  Owner: 'OWNER',
  Admin: 'ADMIN',
  Member: 'MEMBER',
} as const;

export type SpaceInvitationStatusValue =
  (typeof SpaceInvitationStatus)[keyof typeof SpaceInvitationStatus];

export type SpaceInvitationChannelValue =
  (typeof SpaceInvitationChannel)[keyof typeof SpaceInvitationChannel];

export type SpaceMemberRoleValue =
  (typeof SpaceMemberRole)[keyof typeof SpaceMemberRole];

export type TenantRoleValue = (typeof TenantRole)[keyof typeof TenantRole];

export type SpaceInvitation = {
  id: string;
  tenantId: string;
  spaceId: string;

  inviterUserId: string;
  inviteeEmail: string | null;
  inviteeUserId: string | null;

  role: SpaceMemberRoleValue;
  channel: SpaceInvitationChannelValue;
  status: SpaceInvitationStatusValue;

  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  sentAt: Date | null;
  resendCount: number;

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SpaceMember = {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRoleValue;
  createdAt: Date;
  updatedAt: Date;
};

export type SpaceInvitationWithToken = {
  invitation: SpaceInvitation;
  inviteToken: string;
  inviteUrl: string;
};

export type CreateSpaceInvitationRecordInput = {
  inviteeEmail: string | null;
  role: SpaceMemberRoleValue;
  channel: SpaceInvitationChannelValue;
  tokenHash: string;
};

export type AcceptSpaceInvitationResult =
  | {
      ok: true;
      tenantId: string;
      spaceId: string;
      invitation: SpaceInvitation;
    }
  | {
      ok: false;
      reason:
        | 'NOT_FOUND'
        | 'EXPIRED'
        | 'REVOKED'
        | 'ALREADY_ACCEPTED'
        | 'EMAIL_MISMATCH';
    };
