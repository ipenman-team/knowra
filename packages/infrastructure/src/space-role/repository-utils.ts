import type {
  Prisma,
  PrismaClient,
  SpaceMemberRole,
  SpaceRole as PrismaSpaceRole,
  SpaceRoleBuiltInType as PrismaSpaceRoleBuiltInType,
} from '@prisma/client';
import {
  BuiltInDefaultPermissions,
  type PermissionKey,
  type SpaceRole,
  type SpaceRoleBuiltInTypeValue,
} from '@contexta/domain';

export type DbClient = PrismaClient | Prisma.TransactionClient;

const ROLE_NAME_MAP: Record<SpaceMemberRole, string> = {
  OWNER: '所有者',
  ADMIN: '管理员',
  MEMBER: '成员',
};

const BUILT_IN_TYPE_BY_ROLE: Record<SpaceMemberRole, SpaceRoleBuiltInTypeValue> = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

function defaultPermissionsByBuiltInType(
  builtInType: SpaceRoleBuiltInTypeValue | null,
): PermissionKey[] {
  if (builtInType === 'OWNER') return [...BuiltInDefaultPermissions.owner];
  if (builtInType === 'ADMIN') return [...BuiltInDefaultPermissions.admin];
  if (builtInType === 'MEMBER') return [...BuiltInDefaultPermissions.member];
  return [];
}

function normalizePermissions(raw: unknown): PermissionKey[] {
  if (!Array.isArray(raw)) return [];

  const values = raw
    .map((item) => String(item ?? '').trim())
    .filter((item) => Boolean(item));

  return [...new Set(values)] as PermissionKey[];
}

export function mapSpaceRole(row: PrismaSpaceRole): SpaceRole {
  return {
    id: row.id,
    tenantId: row.tenantId,
    spaceId: row.spaceId,
    name: row.name,
    description: row.description,
    isBuiltIn: row.isBuiltIn,
    builtInType: row.builtInType,
    permissions: normalizePermissions(row.permissions),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function buildBuiltInRoleId(
  spaceId: string,
  builtInType: SpaceRoleBuiltInTypeValue,
): string {
  if (builtInType === 'OWNER') return `${spaceId}_role_owner`;
  if (builtInType === 'ADMIN') return `${spaceId}_role_admin`;
  return `${spaceId}_role_member`;
}

function builtInRoleName(builtInType: SpaceRoleBuiltInTypeValue): string {
  if (builtInType === 'OWNER') return '所有者';
  if (builtInType === 'ADMIN') return '管理员';
  return '成员';
}

export async function ensureBuiltInRoles(
  db: DbClient,
  params: {
    tenantId: string;
    spaceId: string;
    actorId: string;
  },
): Promise<{
  ownerRoleId: string;
  adminRoleId: string;
  memberRoleId: string;
}> {
  const space = await db.space.findFirst({
    where: {
      id: params.spaceId,
      tenantId: params.tenantId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!space) throw new Error('space not found');

  const now = new Date();

  const ownerRoleId = buildBuiltInRoleId(params.spaceId, 'OWNER');
  const adminRoleId = buildBuiltInRoleId(params.spaceId, 'ADMIN');
  const memberRoleId = buildBuiltInRoleId(params.spaceId, 'MEMBER');

  const records: {
    id: string;
    builtInType: SpaceRoleBuiltInTypeValue;
    permissions: PermissionKey[];
  }[] = [
    {
      id: ownerRoleId,
      builtInType: 'OWNER',
      permissions: BuiltInDefaultPermissions.owner,
    },
    {
      id: adminRoleId,
      builtInType: 'ADMIN',
      permissions: BuiltInDefaultPermissions.admin,
    },
    {
      id: memberRoleId,
      builtInType: 'MEMBER',
      permissions: BuiltInDefaultPermissions.member,
    },
  ];

  for (const record of records) {
    await db.spaceRole.upsert({
      where: { id: record.id },
      update: {
        name: builtInRoleName(record.builtInType),
        isBuiltIn: true,
        builtInType: record.builtInType,
        permissions: record.permissions,
        isDeleted: false,
        updatedBy: params.actorId,
        updatedAt: now,
      },
      create: {
        id: record.id,
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        name: builtInRoleName(record.builtInType),
        description: `内置角色：${builtInRoleName(record.builtInType)}`,
        isBuiltIn: true,
        builtInType: record.builtInType,
        permissions: record.permissions,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      },
    });
  }

  return {
    ownerRoleId,
    adminRoleId,
    memberRoleId,
  };
}

export function getPermissionsFromRoleRecord(params: {
  memberRole: SpaceMemberRole;
  roleRecord: {
    builtInType: PrismaSpaceRoleBuiltInType | null;
    permissions: unknown;
    isDeleted: boolean;
  } | null;
}): PermissionKey[] {
  const roleRecord = params.roleRecord;

  if (roleRecord && !roleRecord.isDeleted) {
    const rolePermissions = normalizePermissions(roleRecord.permissions);
    if (rolePermissions.length > 0) return rolePermissions;

    return defaultPermissionsByBuiltInType(
      roleRecord.builtInType as SpaceRoleBuiltInTypeValue | null,
    );
  }

  return defaultPermissionsByBuiltInType(BUILT_IN_TYPE_BY_ROLE[params.memberRole]);
}

export async function hasSpacePermission(
  db: DbClient,
  params: {
    tenantId: string;
    spaceId: string;
    userId: string;
    permission: PermissionKey;
  },
): Promise<boolean> {
  const space = await db.space.findFirst({
    where: {
      id: params.spaceId,
      tenantId: params.tenantId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!space) return false;

  const tenantMembership = await db.tenantMembership.findFirst({
    where: {
      tenantId: params.tenantId,
      userId: params.userId,
      isDeleted: false,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: { id: true },
  });

  if (tenantMembership) return true;

  const member = await db.spaceMember.findFirst({
    where: {
      spaceId: params.spaceId,
      userId: params.userId,
      isDeleted: false,
      space: {
        tenantId: params.tenantId,
        isDeleted: false,
      },
    },
    include: {
      spaceRole: {
        select: {
          builtInType: true,
          permissions: true,
          isDeleted: true,
        },
      },
    },
  });

  if (!member) return false;
  if (member.role === 'OWNER') return true;

  const permissions = getPermissionsFromRoleRecord({
    memberRole: member.role,
    roleRecord: member.spaceRole,
  });

  return permissions.includes(params.permission);
}

export function fallbackRoleNameFromMemberRole(role: SpaceMemberRole): string {
  return ROLE_NAME_MAP[role];
}
