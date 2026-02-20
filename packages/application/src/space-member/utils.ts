import type { SpaceMemberRoleValue } from '@knowra/domain';
import type { SpaceRole } from '@knowra/domain';

export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function normalizeIds(raw: unknown, field: string): string[] {
  if (!Array.isArray(raw)) throw new Error(`${field} must be array`);
  const ids = raw
    .map((item) => String(item ?? '').trim())
    .filter((item) => Boolean(item));
  const unique = [...new Set(ids)];
  if (unique.length === 0) throw new Error(`${field} is required`);
  return unique;
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
