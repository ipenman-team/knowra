import type { SpaceMemberRecord, SpaceMemberSummary } from '../types';
import type { SpaceMemberRoleValue } from '../../space-invitation';

export interface SpaceMemberRepository {
  listMembers(params: {
    tenantId: string;
    spaceId: string;
    q?: string | null;
    skip: number;
    take: number;
  }): Promise<{
    items: SpaceMemberSummary[];
    total: number;
  }>;

  getMemberById(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
  }): Promise<SpaceMemberRecord | null>;

  listMembersByIds(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
  }): Promise<SpaceMemberRecord[]>;

  countOwners(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<number>;

  updateMemberRole(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    role: SpaceMemberRoleValue;
    spaceRoleId: string;
    actorId: string;
  }): Promise<boolean>;

  updateMembersRole(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    role: SpaceMemberRoleValue;
    spaceRoleId: string;
    actorId: string;
  }): Promise<number>;

  removeMember(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    actorId: string;
  }): Promise<boolean>;

  removeMembers(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    actorId: string;
  }): Promise<number>;
}
