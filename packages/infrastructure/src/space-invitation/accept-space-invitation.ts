import type { PrismaClient } from '@prisma/client';
import type { AcceptSpaceInvitationResult } from '@contexta/domain';
import { mapInvitation, resolveHigherRole } from './repository-utils';

export async function acceptSpaceInvitationByTokenHash(
  prisma: PrismaClient,
  params: {
    tokenHash: string;
    userId: string;
    actorId: string;
    now: Date;
  },
): Promise<AcceptSpaceInvitationResult> {
  return await prisma.$transaction(async (tx) => {
    const row = await tx.spaceInvitation.findFirst({
      where: {
        tokenHash: params.tokenHash,
        isDeleted: false,
      },
    });

    if (!row) return { ok: false, reason: 'NOT_FOUND' };

    const isExpired = row.expiresAt.getTime() <= params.now.getTime();

    if (row.status === 'REVOKED') return { ok: false, reason: 'REVOKED' };
    if (row.status === 'ACCEPTED') {
      return { ok: false, reason: 'ALREADY_ACCEPTED' };
    }

    if (row.status === 'EXPIRED' || isExpired) {
      if (row.status !== 'EXPIRED') {
        await tx.spaceInvitation.update({
          where: { id: row.id },
          data: {
            status: 'EXPIRED',
            updatedBy: params.actorId,
          },
        });
      }
      return { ok: false, reason: 'EXPIRED' };
    }

    if (row.inviteeEmail) {
      const identity = await tx.userIdentity.findFirst({
        where: {
          userId: params.userId,
          provider: 'email',
          identifier: row.inviteeEmail,
          isDeleted: false,
          isVerified: true,
        },
        select: { id: true },
      });

      if (!identity) {
        return { ok: false, reason: 'EMAIL_MISMATCH' };
      }
    }

    const tenantMembership = await tx.tenantMembership.findFirst({
      where: {
        tenantId: row.tenantId,
        userId: params.userId,
        isDeleted: false,
      },
    });

    if (!tenantMembership) {
      await tx.tenantMembership.create({
        data: {
          tenantId: row.tenantId,
          userId: params.userId,
          role: 'MEMBER',
          createdBy: params.actorId,
          updatedBy: params.actorId,
        },
      });
    }

    const spaceMember = await tx.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: row.spaceId,
          userId: params.userId,
        },
      },
    });

    if (!spaceMember) {
      await tx.spaceMember.create({
        data: {
          spaceId: row.spaceId,
          userId: params.userId,
          role: row.role,
          createdBy: params.actorId,
          updatedBy: params.actorId,
        },
      });
    } else {
      await tx.spaceMember.update({
        where: { id: spaceMember.id },
        data: {
          role: resolveHigherRole(spaceMember.role, row.role),
          isDeleted: false,
          updatedBy: params.actorId,
        },
      });
    }

    const updated = await tx.spaceInvitation.update({
      where: { id: row.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: params.now,
        acceptedBy: params.userId,
        inviteeUserId: params.userId,
        updatedBy: params.actorId,
      },
    });

    return {
      ok: true,
      tenantId: updated.tenantId,
      spaceId: updated.spaceId,
      invitation: mapInvitation(updated),
    };
  });
}
