import type {
  AcceptSpaceInvitationResult,
  CreateSpaceInvitationRecordInput,
  SpaceInvitation,
  SpaceMember,
  SpaceInvitationStatusValue,
} from '../types';

export interface SpaceInvitationRepository {
  canManageSpaceInvitations(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
  }): Promise<boolean>;

  createInvitations(params: {
    tenantId: string;
    spaceId: string;
    inviterUserId: string;
    actorId: string;
    expiresAt: Date;
    records: CreateSpaceInvitationRecordInput[];
  }): Promise<SpaceInvitation[]>;

  listInvitations(params: {
    tenantId: string;
    spaceId: string;
    statuses?: SpaceInvitationStatusValue[] | null;
    now: Date;
  }): Promise<SpaceInvitation[]>;

  getInvitationById(params: {
    tenantId: string;
    spaceId: string;
    invitationId: string;
    now: Date;
  }): Promise<SpaceInvitation | null>;

  resendInvitation(params: {
    tenantId: string;
    spaceId: string;
    invitationId: string;
    tokenHash: string;
    expiresAt: Date;
    actorId: string;
    now: Date;
  }): Promise<SpaceInvitation | null>;

  acceptInvitationByTokenHash(params: {
    tokenHash: string;
    userId: string;
    actorId: string;
    now: Date;
  }): Promise<AcceptSpaceInvitationResult>;

  listMembers(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<SpaceMember[]>;
}
