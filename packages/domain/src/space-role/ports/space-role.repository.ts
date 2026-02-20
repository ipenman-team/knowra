import type {
  PermissionKey,
  SpaceRole,
  SpaceRoleBuiltInTypeValue,
} from '../types';

export interface SpaceRoleRepository {
  canManageRoles(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
  }): Promise<boolean>;

  canManageMembers(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
    permission:
      | 'space.member.view'
      | 'space.member.invite'
      | 'space.member.remove'
      | 'space.member.role_change';
  }): Promise<boolean>;

  listRoles(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<SpaceRole[]>;

  getRoleById(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
  }): Promise<SpaceRole | null>;

  getBuiltInRole(params: {
    tenantId: string;
    spaceId: string;
    builtInType: SpaceRoleBuiltInTypeValue;
  }): Promise<SpaceRole | null>;

  createRole(params: {
    tenantId: string;
    spaceId: string;
    name: string;
    description: string | null;
    permissions: PermissionKey[];
    actorId: string;
  }): Promise<SpaceRole>;

  updateRole(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    name?: string;
    description?: string | null;
    permissions?: PermissionKey[];
    actorId: string;
  }): Promise<SpaceRole | null>;

  deleteRole(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    fallbackRoleId: string;
    actorId: string;
  }): Promise<{
    deleted: boolean;
    downgradedMemberCount: number;
    downgradedInvitationCount: number;
  }>;

  ensureBuiltInRoles(params: {
    tenantId: string;
    spaceId: string;
    actorId: string;
  }): Promise<{
    ownerRoleId: string;
    adminRoleId: string;
    memberRoleId: string;
  }>;
}
