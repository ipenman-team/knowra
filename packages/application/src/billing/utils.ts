import * as crypto from 'node:crypto';
import type { BillingChannel, BillingClientType } from '@knowra/domain';

const CLIENT_TYPES: BillingClientType[] = [
  'WEB_PC',
  'WEB_MOBILE_BROWSER',
  'WECHAT_IN_APP_BROWSER',
  'ALIPAY_IN_APP_BROWSER',
  'APP_WEBVIEW',
];

const CHANNELS: BillingChannel[] = ['ALIPAY', 'WECHAT_PAY'];

export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function normalizeOptionalText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value || null;
}

export function normalizeChannel(raw: unknown): BillingChannel {
  const value = normalizeRequiredText(
    'channel',
    raw,
  ).toUpperCase() as BillingChannel;
  if (!CHANNELS.includes(value)) throw new Error('channel is invalid');
  return value;
}

export function normalizeClientType(raw: unknown): BillingClientType {
  if (typeof raw !== 'string' || !raw.trim()) return 'WEB_PC';
  const value = raw.trim().toUpperCase() as BillingClientType;
  if (!CLIENT_TYPES.includes(value)) return 'WEB_PC';
  return value;
}

export function sanitizeReturnUrl(raw: unknown): string | null {
  const value = normalizeOptionalText(raw);
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('returnUrl is invalid');
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('returnUrl is invalid');
  }

  const whitelist = (process.env.BILLING_RETURN_URL_WHITELIST ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => Boolean(item));

  if (whitelist.length === 0) return parsed.toString();
  if (!whitelist.includes(parsed.host.toLowerCase())) {
    throw new Error('returnUrl host is not allowed');
  }

  return parsed.toString();
}

export function clampPagination(
  skip: number | null | undefined,
  take: number | null | undefined,
): { skip: number; take: number } {
  const nextSkip = Number.isFinite(skip) ? Math.max(Number(skip), 0) : 0;
  const nextTake = Number.isFinite(take)
    ? Math.min(Math.max(Number(take), 1), 100)
    : 20;

  return {
    skip: Math.floor(nextSkip),
    take: Math.floor(nextTake),
  };
}

export function makeOrderNo(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `B${stamp}${random}`;
}

export function makeBillNo(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BL${stamp}${random}`;
}

export function buildExpiresAt(base: Date): Date {
  const expiredAt = new Date(base.getTime());
  expiredAt.setMinutes(expiredAt.getMinutes() + 30);
  return expiredAt;
}

export function pickActorId(actorUserId: string): string {
  return actorUserId || 'system';
}
