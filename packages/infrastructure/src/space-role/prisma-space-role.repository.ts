import type {
  PermissionKey,
  SpaceRole,
  SpaceRoleBuiltInTypeValue,
  SpaceRoleRepository,
} from '@contexta/domain';
import type { PrismaClient } from '@prisma/client';
import {
  ensureBuiltInRoles,
  hasSpacePermission,
  mapSpaceRole,
} from './repository-utils';

export class PrismaSpaceRoleRepository implements SpaceRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async canManageRoles(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
  }): Promise<boolean> {
    return await hasSpacePermission(this.prisma, {
      ...params,
      permission: 'space.role.manage',
    });
  }

  async canManageMembers(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
    permission:
      | 'space.member.view'
      | 'space.member.invite'
      | 'space.member.remove'
      | 'space.member.role_change';
  }): Promise<boolean> {
    return await hasSpacePermission(this.prisma, {
      tenantId: params.tenantId,
      spaceId: params.spaceId,
      userId: params.userId,
      permission: params.permission,
    });
  }

  async listRoles(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<SpaceRole[]> {
    const rows = await this.prisma.spaceRole.findMany({
      where: {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
      },
      orderBy: [
        { isBuiltIn: 'desc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    return rows.map(mapSpaceRole);
  }

  async getRoleById(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
  }): Promise<SpaceRole | null> {
    const row = await this.prisma.spaceRole.findFirst({
      where: {
        id: params.roleId,
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
      },
    });

    return row ? mapSpaceRole(row) : null;
  }

  async getBuiltInRole(params: {
    tenantId: string;
    spaceId: string;
    builtInType: SpaceRoleBuiltInTypeValue;
  }): Promise<SpaceRole | null> {
    const row = await this.prisma.spaceRole.findFirst({
      where: {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
        isBuiltIn: true,
        builtInType: params.builtInType,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return row ? mapSpaceRole(row) : null;
  }

  async createRole(params: {
    tenantId: string;
    spaceId: string;
    name: string;
    description: string | null;
    permissions: PermissionKey[];
    actorId: string;
  }): Promise<SpaceRole> {
    const duplicated = await this.prisma.spaceRole.findFirst({
      where: {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
        name: {
          equals: params.name,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (duplicated) throw new Error('role name already exists');

    const created = await this.prisma.spaceRole.create({
      data: {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        name: params.name,
        description: params.description,
        isBuiltIn: false,
        builtInType: null,
        permissions: params.permissions,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      },
    });

    return mapSpaceRole(created);
  }

  async updateRole(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    name?: string;
    description?: string | null;
    permissions?: PermissionKey[];
    actorId: string;
  }): Promise<SpaceRole | null> {
    const existing = await this.prisma.spaceRole.findFirst({
      where: {
        id: params.roleId,
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
      },
    });

    if (!existing) return null;

    if (params.name && params.name !== existing.name) {
      const duplicated = await this.prisma.spaceRole.findFirst({
        where: {
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          isDeleted: false,
          id: { not: params.roleId },
          name: {
            equals: params.name,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });
      if (duplicated) throw new Error('role name already exists');
    }

    const updated = await this.prisma.spaceRole.update({
      where: { id: params.roleId },
      data: {
        name: params.name,
        description: params.description,
        permissions: params.permissions,
        updatedBy: params.actorId,
      },
    });

    return mapSpaceRole(updated);
  }

  async deleteRole(params: {
    tenantId: string;
    spaceId: string;
    roleId: string;
    fallbackRoleId: string;
    actorId: string;
  }): Promise<{
    deleted: boolean;
    downgradedMemberCount: number;
    downgradedInvitationCount: number;
  }> {
    return await this.prisma.$transaction(async (tx) => {
      const target = await tx.spaceRole.findFirst({
        where: {
          id: params.roleId,
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          isDeleted: false,
        },
        select: { id: true, isBuiltIn: true },
      });

      if (!target || target.isBuiltIn) {
        return {
          deleted: false,
          downgradedMemberCount: 0,
          downgradedInvitationCount: 0,
        };
      }

      const fallback = await tx.spaceRole.findFirst({
        where: {
          id: params.fallbackRoleId,
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (!fallback) throw new Error('member built-in role not found');

      const memberResult = await tx.spaceMember.updateMany({
        where: {
          spaceId: params.spaceId,
          spaceRoleId: params.roleId,
          isDeleted: false,
          space: {
            tenantId: params.tenantId,
            isDeleted: false,
          },
        },
        data: {
          role: 'MEMBER',
          spaceRoleId: params.fallbackRoleId,
          updatedBy: params.actorId,
        },
      });

      const invitationResult = await tx.spaceInvitation.updateMany({
        where: {
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          spaceRoleId: params.roleId,
          isDeleted: false,
          status: { in: ['PENDING', 'EXPIRED'] },
        },
        data: {
          role: 'MEMBER',
          spaceRoleId: params.fallbackRoleId,
          updatedBy: params.actorId,
        },
      });

      await tx.spaceRole.update({
        where: { id: params.roleId },
        data: {
          isDeleted: true,
          updatedBy: params.actorId,
        },
      });

      return {
        deleted: true,
        downgradedMemberCount: memberResult.count,
        downgradedInvitationCount: invitationResult.count,
      };
    });
  }

  async ensureBuiltInRoles(params: {
    tenantId: string;
    spaceId: string;
    actorId: string;
  }): Promise<{
    ownerRoleId: string;
    adminRoleId: string;
    memberRoleId: string;
  }> {
    return await ensureBuiltInRoles(this.prisma, params);
  }
}
