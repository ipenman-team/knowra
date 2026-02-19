import type {
  Prisma,
  PrismaClient,
  SpaceInvitation as PrismaSpaceInvitation,
  SpaceMember as PrismaSpaceMember,
} from '@prisma/client';
import type {
  SpaceInvitation,
  SpaceMember,
  SpaceMemberRoleValue,
} from '@contexta/domain';

export type DbClient = PrismaClient | Prisma.TransactionClient;

export function mapInvitation(row: PrismaSpaceInvitation): SpaceInvitation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    spaceId: row.spaceId,
    inviterUserId: row.inviterUserId,
    inviteeEmail: row.inviteeEmail,
    inviteeUserId: row.inviteeUserId,
    role: row.role,
    channel: row.channel,
    status: row.status,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
    acceptedBy: row.acceptedBy,
    sentAt: row.sentAt,
    resendCount: row.resendCount,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapMember(row: PrismaSpaceMember): SpaceMember {
  return {
    id: row.id,
    spaceId: row.spaceId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function resolveHigherRole(
  current: SpaceMemberRoleValue,
  incoming: SpaceMemberRoleValue,
): SpaceMemberRoleValue {
  const rank: Record<SpaceMemberRoleValue, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };
  return rank[incoming] > rank[current] ? incoming : current;
}

export async function expireInvitations(
  db: DbClient,
  params: {
    tenantId: string;
    spaceId: string;
    now: Date;
    invitationId?: string;
  },
): Promise<void> {
  await db.spaceInvitation.updateMany({
    where: {
      tenantId: params.tenantId,
      spaceId: params.spaceId,
      id: params.invitationId,
      isDeleted: false,
      status: 'PENDING',
      expiresAt: { lte: params.now },
    },
    data: {
      status: 'EXPIRED',
      updatedBy: 'system',
    },
  });
}
