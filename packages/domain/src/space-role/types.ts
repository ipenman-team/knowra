export const SpaceRoleBuiltInType = {
  Owner: 'OWNER',
  Admin: 'ADMIN',
  Member: 'MEMBER',
} as const;

export type SpaceRoleBuiltInTypeValue =
  (typeof SpaceRoleBuiltInType)[keyof typeof SpaceRoleBuiltInType];

export const PermissionKeys = [
  'space.view',
  'space.edit',
  'space.delete',
  'space.archive',
  'space.member.view',
  'space.member.invite',
  'space.member.remove',
  'space.member.role_change',
  'space.role.manage',
  'space.share.manage',
  'page.create',
  'page.view',
  'page.edit',
  'page.publish',
  'page.delete',
  'page.restore',
  'page.purge',
  'page.export',
  'page.share.manage',
  'page.import',
  'comment.create',
  'comment.delete_own',
  'comment.delete_any',
  'page.like',
  'rag.index.manage',
] as const;

export type PermissionKey = (typeof PermissionKeys)[number];

export type SpaceRole = {
  id: string;
  tenantId: string;
  spaceId: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  builtInType: SpaceRoleBuiltInTypeValue | null;
  permissions: PermissionKey[];
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DefaultBuiltInRoleSet = {
  owner: PermissionKey[];
  admin: PermissionKey[];
  member: PermissionKey[];
};

const ALL_PERMISSIONS = [...PermissionKeys] as PermissionKey[];

const ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(
  (permission) => permission !== 'space.delete',
) as PermissionKey[];

const MEMBER_PERMISSIONS = [
  'space.view',
  'space.member.view',
  'page.create',
  'page.view',
  'page.edit',
  'page.publish',
  'page.delete',
  'page.restore',
  'page.export',
  'page.import',
  'page.share.manage',
  'comment.create',
  'comment.delete_own',
  'page.like',
] as PermissionKey[];

export const BuiltInDefaultPermissions: DefaultBuiltInRoleSet = {
  owner: ALL_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  member: MEMBER_PERMISSIONS,
};

export type SpaceRoleSummary = {
  id: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  builtInType: SpaceRoleBuiltInTypeValue | null;
  permissions: PermissionKey[];
};
