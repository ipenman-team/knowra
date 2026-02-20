import {
  PermissionKeys,
  type PermissionKey,
  type SpaceRole,
} from '@knowra/domain';
import type { SpaceMemberRoleValue } from '@knowra/domain';

const permissionSet = new Set<string>(PermissionKeys);

export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function normalizeOptionalText(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const value = String(raw).trim();
  return value ? value : null;
}

export function normalizePermissionKeys(raw: unknown): PermissionKey[] {
  if (!Array.isArray(raw)) throw new Error('permissions must be array');

  const values = raw
    .map((item) => String(item ?? '').trim())
    .filter((item) => Boolean(item));

  const unique = [...new Set(values)];

  for (const permission of unique) {
    if (!permissionSet.has(permission)) {
      throw new Error(`invalid permission: ${permission}`);
    }
  }

  return unique as PermissionKey[];
}

export function normalizePagination(params: {
  skip?: unknown;
  take?: unknown;
}): { skip: number; take: number } {
  const skip = Math.max(Number(params.skip ?? 0) || 0, 0);
  const takeRaw = Number(params.take ?? 20) || 20;
  const take = Math.min(Math.max(takeRaw, 1), 100);
  return { skip, take };
}

export function resolveMemberRoleFromSpaceRole(
  role: Pick<SpaceRole, 'builtInType'>,
): SpaceMemberRoleValue {
  if (role.builtInType === 'OWNER') return 'OWNER';
  if (role.builtInType === 'ADMIN') return 'ADMIN';
  return 'MEMBER';
}
