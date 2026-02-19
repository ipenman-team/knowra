import type { PrismaClient } from '@prisma/client';
import type {
  AcceptSpaceInvitationResult,
  SpaceInvitation,
  SpaceInvitationRepository,
  SpaceInvitationStatusValue,
  SpaceMember,
  SpaceMemberRoleValue,
} from '@contexta/domain';
import { acceptSpaceInvitationByTokenHash } from './accept-space-invitation';
import { expireInvitations, mapInvitation, mapMember } from './repository-utils';

export class PrismaSpaceInvitationRepository implements SpaceInvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async canManageSpaceInvitations(params: {
    tenantId: string;
    spaceId: string;
    userId: string;
  }): Promise<boolean> {
    const space = await this.prisma.space.findFirst({
      where: {
        id: params.spaceId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!space) return false;

    const tenantMembership = await this.prisma.tenantMembership.findFirst({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        isDeleted: false,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: { id: true },
    });
    if (tenantMembership) return true;

    const spaceMembership = await this.prisma.spaceMember.findFirst({
      where: {
        spaceId: params.spaceId,
        userId: params.userId,
        isDeleted: false,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: { id: true },
    });

    return Boolean(spaceMembership);
  }

  async createInvitations(params: {
    tenantId: string;
    spaceId: string;
    inviterUserId: string;
    actorId: string;
    expiresAt: Date;
    records: {
      inviteeEmail: string | null;
      role: SpaceMemberRoleValue;
      channel: 'EMAIL' | 'LINK';
      tokenHash: string;
    }[];
  }): Promise<SpaceInvitation[]> {
    if (params.records.length === 0) return [];

    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      await expireInvitations(tx, {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        now,
      });

      const rows = [] as Awaited<
        ReturnType<typeof tx.spaceInvitation.create>
      >[];

      for (const record of params.records) {
        const row = await tx.spaceInvitation.create({
          data: {
            tenantId: params.tenantId,
            spaceId: params.spaceId,
            inviterUserId: params.inviterUserId,
            inviteeEmail: record.inviteeEmail,
            inviteeUserId: null,
            role: record.role,
            channel: record.channel,
            status: 'PENDING',
            tokenHash: record.tokenHash,
            expiresAt: params.expiresAt,
            acceptedAt: null,
            acceptedBy: null,
            sentAt: now,
            resendCount: 0,
            createdBy: params.actorId,
            updatedBy: params.actorId,
          },
        });
        rows.push(row);
      }

      return rows;
    });

    return created.map(mapInvitation);
  }

  async listInvitations(params: {
    tenantId: string;
    spaceId: string;
    statuses?: SpaceInvitationStatusValue[] | null;
    now: Date;
  }): Promise<SpaceInvitation[]> {
    await expireInvitations(this.prisma, {
      tenantId: params.tenantId,
      spaceId: params.spaceId,
      now: params.now,
    });

    const rows = await this.prisma.spaceInvitation.findMany({
      where: {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
        status:
          params.statuses && params.statuses.length > 0
            ? { in: params.statuses }
            : undefined,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return rows.map(mapInvitation);
  }

  async getInvitationById(params: {
    tenantId: string;
    spaceId: string;
    invitationId: string;
    now: Date;
  }): Promise<SpaceInvitation | null> {
    await expireInvitations(this.prisma, {
      tenantId: params.tenantId,
      spaceId: params.spaceId,
      now: params.now,
      invitationId: params.invitationId,
    });

    const row = await this.prisma.spaceInvitation.findFirst({
      where: {
        id: params.invitationId,
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        isDeleted: false,
      },
    });

    return row ? mapInvitation(row) : null;
  }

  async resendInvitation(params: {
    tenantId: string;
    spaceId: string;
    invitationId: string;
    tokenHash: string;
    expiresAt: Date;
    actorId: string;
    now: Date;
  }): Promise<SpaceInvitation | null> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await expireInvitations(tx, {
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        now: params.now,
        invitationId: params.invitationId,
      });

      const result = await tx.spaceInvitation.updateMany({
        where: {
          id: params.invitationId,
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          isDeleted: false,
          status: { in: ['PENDING', 'EXPIRED'] },
        },
        data: {
          status: 'PENDING',
          tokenHash: params.tokenHash,
          expiresAt: params.expiresAt,
          sentAt: params.now,
          resendCount: { increment: 1 },
          updatedBy: params.actorId,
        },
      });

      if (result.count < 1) return null;

      return await tx.spaceInvitation.findUnique({
        where: { id: params.invitationId },
      });
    });

    return updated ? mapInvitation(updated) : null;
  }

  async acceptInvitationByTokenHash(params: {
    tokenHash: string;
    userId: string;
    actorId: string;
    now: Date;
  }): Promise<AcceptSpaceInvitationResult> {
    return await acceptSpaceInvitationByTokenHash(this.prisma, params);
  }

  async listMembers(params: {
    tenantId: string;
    spaceId: string;
  }): Promise<SpaceMember[]> {
    const rows = await this.prisma.spaceMember.findMany({
      where: {
        spaceId: params.spaceId,
        isDeleted: false,
        space: {
          tenantId: params.tenantId,
          isDeleted: false,
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return rows.map(mapMember);
  }
}
