export type SpaceDto = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  identifier?: string | null;
  type: string;
  isArchived: boolean;
  metadata?: unknown | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SpaceMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type SpaceInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

export type SpaceInvitationChannel = 'EMAIL' | 'LINK';

export type SpaceMemberDto = {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
  createdAt: string;
  updatedAt: string;
};

export type SpaceInvitationDto = {
  id: string;
  tenantId: string;
  spaceId: string;
  inviterUserId: string;
  inviteeEmail: string | null;
  inviteeUserId: string | null;
  role: SpaceMemberRole;
  channel: SpaceInvitationChannel;
  status: SpaceInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  sentAt: string | null;
  resendCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SpaceInvitationWithTokenDto = {
  invitation: SpaceInvitationDto;
  inviteToken: string;
  inviteUrl: string;
};
