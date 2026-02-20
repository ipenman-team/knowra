import type { SpaceMemberRepository } from '@contexta/domain';
import type { SpaceMemberRecord, SpaceMemberSummary } from '@contexta/domain';
import type { SpaceMemberRoleValue } from '@contexta/domain';
import type { PrismaClient } from '@prisma/client';
import { fallbackRoleNameFromMemberRole } from '../space-role/repository-utils';

function mapMemberRecord(row: {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRoleValue;
  spaceRoleId: string | null;
  isDeleted: boolean;
}): SpaceMemberRecord {
  return {
    id: row.id,
    spaceId: row.spaceId,
    userId: row.userId,
    role: row.role,
    spaceRoleId: row.spaceRoleId,
    isDeleted: row.isDeleted,
  };
}

function mapMemberSummary(row: {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRoleValue;
  spaceRoleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  spaceRole: {
    id: string;
    name: string;
    isBuiltIn: boolean;
    builtInType: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  } | null;
  user: {
    profile: {
      nickname: string | null;
      avatarUrl: string | null;
    } | null;
    identities: {
      identifier: string;
    }[];
  };
}): SpaceMemberSummary {
  return {
    id: row.id,
    spaceId: row.spaceId,
    userId: row.userId,
    role: row.role,
    spaceRoleId: row.spaceRoleId,
    roleName: row.spaceRole?.name ?? fallbackRoleNameFromMemberRole(row.role),
    roleBuiltInType: row.spaceRole ? row.spaceRole.builtInType : row.role,
    roleIsBuiltIn: row.spaceRole?.isBuiltIn ?? true,
    nickname: row.user.profile?.nickname ?? null,
    avatarUrl: row.user.profile?.avatarUrl ?? null,
    email: row.user.identities[0]?.identifier ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaSpaceMemberRepository implements SpaceMemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listMembers(params: {
    tenantId: string;
    spaceId: string;
    q?: string | null;
    skip: number;
    take: number;
  }): Promise<{ items: SpaceMemberSummary[]; total: number }> {
    const q = params.q?.trim();

    const where = {
      spaceId: params.spaceId,
      isDeleted: false,
      space: {
        tenantId: params.tenantId,
        isDeleted: false,
      },
      user: q
        ? {
            OR: [
              {
                profile: {
                  nickname: {
                    contains: q,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                profile: {
                  nicknamePinyin: {
                    contains: q,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                profile: {
                  nicknamePinyinAbbr: {
                    contains: q,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                identities: {
                  some: {
                    provider: 'email',
                    isDeleted: false,
                    identifier: {
                      contains: q,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : undefined,
    };

    const [rows, total] = await Promise.all([
      this.prisma.spaceMember.findMany({
        where,
        include: {
          spaceRole: {
            select: {
              id: true,
              name: true,
              isBuiltIn: true,
              builtInType: true,
            },
          },
          user: {
            select: {
              profile: {
                select: {
                  nickname: true,
                  avatarUrl: true,
                },
              },
              identities: {
                where: {
                  provider: 'email',
                  isDeleted: false,
                },
                select: {
                  identifier: true,
                },
                orderBy: [{ createdAt: 'asc' }],
                take: 1,
              },
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.spaceMember.count({ where }),
    ]);

    return {
      items: rows.map((row) => mapMemberSummary(row)),
      total,
    };
  }

  async getMemberById(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
  }): Promise<SpaceMemberRecord | null> {
    const row = await this.prisma.spaceMember.findFirst({
      where: {
        id: params.memberId,
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      select: {
        id: true,
        spaceId: true,
        userId: true,
        role: true,
        spaceRoleId: true,
        isDeleted: true,
      },
    });

    return row ? mapMemberRecord(row) : null;
  }

  async listMembersByIds(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
  }): Promise<SpaceMemberRecord[]> {
    if (params.memberIds.length === 0) return [];

    const rows = await this.prisma.spaceMember.findMany({
      where: {
        id: { in: params.memberIds },
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      select: {
        id: true,
        spaceId: true,
        userId: true,
        role: true,
        spaceRoleId: true,
        isDeleted: true,
      },
    });

    return rows.map((row) => mapMemberRecord(row));
  }

  async countOwners(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<number> {
    return await this.prisma.spaceMember.count({
      where: {
        spaceId: params.spaceId,
        role: 'OWNER',
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
    });
  }

  async updateMemberRole(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    role: SpaceMemberRoleValue;
    spaceRoleId: string;
    actorId: string;
  }): Promise<boolean> {
    const result = await this.prisma.spaceMember.updateMany({
      where: {
        id: params.memberId,
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      data: {
        role: params.role,
        spaceRoleId: params.spaceRoleId,
        updatedBy: params.actorId,
      },
    });

    return result.count > 0;
  }

  async updateMembersRole(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    role: SpaceMemberRoleValue;
    spaceRoleId: string;
    actorId: string;
  }): Promise<number> {
    if (params.memberIds.length === 0) return 0;

    const result = await this.prisma.spaceMember.updateMany({
      where: {
        id: { in: params.memberIds },
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      data: {
        role: params.role,
        spaceRoleId: params.spaceRoleId,
        updatedBy: params.actorId,
      },
    });

    return result.count;
  }

  async removeMember(params: {
    tenantId: string;
    spaceId: string;
    memberId: string;
    actorId: string;
  }): Promise<boolean> {
    const result = await this.prisma.spaceMember.updateMany({
      where: {
        id: params.memberId,
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      data: {
        isDeleted: true,
        updatedBy: params.actorId,
      },
    });

    return result.count > 0;
  }

  async removeMembers(params: {
    tenantId: string;
    spaceId: string;
    memberIds: string[];
    actorId: string;
  }): Promise<number> {
    if (params.memberIds.length === 0) return 0;

    const result = await this.prisma.spaceMember.updateMany({
      where: {
        id: { in: params.memberIds },
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      data: {
        isDeleted: true,
        updatedBy: params.actorId,
      },
    });

    return result.count;
  }
}
