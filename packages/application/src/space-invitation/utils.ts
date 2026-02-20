import { createHash, randomBytes } from 'node:crypto';
import {
  SpaceInvitationStatus,
  type SpaceInvitationRepository,
  type SpaceInvitationStatusValue,
  type SpaceMemberRoleValue,
} from '@knowra/domain';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVITE_TOKEN_BYTES = 24;
const DEFAULT_INVITATION_TTL_DAYS = 7;

function getConfiguredInvitationTtlDays(): number {
  const raw = process.env.SPACE_INVITATION_TTL_DAYS?.trim();
  if (!raw) return DEFAULT_INVITATION_TTL_DAYS;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_INVITATION_TTL_DAYS;
  }

  return Math.floor(value);
}

function getInviteBaseUrl(): string | null {
  const raw =
    process.env.APP_BASE_URL?.trim() ||
    process.env.WEB_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
    '';
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function normalizeInvitationRole(raw: unknown): SpaceMemberRoleValue {
  const value = normalizeRequiredText('role', String(raw ?? 'MEMBER')).toUpperCase();
  if (value === 'ADMIN') return 'ADMIN';
  if (value === 'MEMBER') return 'MEMBER';
  throw new Error('role must be ADMIN or MEMBER');
}

export async function resolveInvitationRoleTarget(
  repo: Pick<
    SpaceInvitationRepository,
    'ensureBuiltInRoles' | 'getRoleById' | 'getBuiltInRole'
  >,
  params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    roleId?: string;
    role?: string;
  },
): Promise<{
  role: SpaceMemberRoleValue;
  spaceRoleId: string;
}> {
  await repo.ensureBuiltInRoles({
    tenantId: params.tenantId,
    spaceId: params.spaceId,
    actorId: params.actorUserId,
  });

  const roleId = params.roleId?.trim();
  if (roleId) {
    const role = await repo.getRoleById({
      tenantId: params.tenantId,
      spaceId: params.spaceId,
      roleId,
    });

    if (!role) throw new Error('role not found');
    if (role.builtInType === 'OWNER') {
      throw new Error('role must be ADMIN or MEMBER');
    }
    if (role.builtInType === 'ADMIN') {
      return { role: 'ADMIN', spaceRoleId: role.id };
    }
    return { role: 'MEMBER', spaceRoleId: role.id };
  }

  const role = normalizeInvitationRole(params.role ?? 'MEMBER');
  const builtInType = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
  const builtInRole = await repo.getBuiltInRole({
    tenantId: params.tenantId,
    spaceId: params.spaceId,
    builtInType,
  });

  if (!builtInRole) throw new Error('role not found');

  return {
    role,
    spaceRoleId: builtInRole.id,
  };
}

export function normalizeInvitationStatuses(
  raw: unknown,
): SpaceInvitationStatusValue[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const values = raw
    .map((item) => String(item ?? '').trim().toUpperCase())
    .filter((item) => Boolean(item));

  if (values.length === 0) return null;

  const unique = [...new Set(values)];
  for (const value of unique) {
    if (
      value !== SpaceInvitationStatus.Pending &&
      value !== SpaceInvitationStatus.Accepted &&
      value !== SpaceInvitationStatus.Expired &&
      value !== SpaceInvitationStatus.Revoked
    ) {
      throw new Error(`invalid invitation status: ${value}`);
    }
  }

  return unique as SpaceInvitationStatusValue[];
}

export function normalizeEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new Error('emails must be array');

  const normalized = raw
    .map((item) => String(item ?? '').trim().toLowerCase())
    .filter((item) => Boolean(item));

  const unique = [...new Set(normalized)];
  if (unique.length === 0) throw new Error('emails is required');

  for (const email of unique) {
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error(`invalid email: ${email}`);
    }
  }

  return unique;
}

export function createInvitationToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString('base64url');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildInvitationUrl(token: string): string {
  const path = `/invite/space?token=${encodeURIComponent(token)}`;
  const baseUrl = getInviteBaseUrl();
  return baseUrl ? `${baseUrl}${path}` : path;
}

export function getInvitationExpiresAt(now: Date): Date {
  const days = getConfiguredInvitationTtlDays();
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
