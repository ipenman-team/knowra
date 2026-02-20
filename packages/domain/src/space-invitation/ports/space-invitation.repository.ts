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

  ensureBuiltInRoles(params: {
    tenantId: string;
    spaceId: string;
    actorId: string;
  }): Promise<{
    ownerRoleId: string;
    adminRoleId: string;
    memberRoleId: string;
  }>;

  getRoleById(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
  }): Promise<{
    id: string;
    builtInType: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  } | null>;

  getBuiltInRole(params: {
    tenantId: string;
    spaceId: string;
    builtInType: 'OWNER' | 'ADMIN' | 'MEMBER';
  }): Promise<{
    id: string;
    builtInType: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  } | null>;

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
