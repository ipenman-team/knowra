import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  type AppLocale,
} from './locale.constants';

function normalizeLocale(raw: string | null | undefined): AppLocale | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value === 'zh-CN' || value === 'en-US') return value;
  const lower = value.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('en')) return 'en-US';
  return null;
}

export function readLocaleFromCookieHeader(
  cookieHeader: string | null | undefined,
): AppLocale | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const item = part.trim();
    if (!item.startsWith(`${LOCALE_COOKIE_KEY}=`)) continue;
    const cookieValue = item.slice(LOCALE_COOKIE_KEY.length + 1);
    return normalizeLocale(cookieValue);
  }
  return null;
}

export function readLocaleFromAcceptLanguage(
  acceptLanguage: string | string[] | null | undefined,
): AppLocale | null {
  const raw = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim() ?? '';
  return normalizeLocale(first);
}

export function resolveRequestLocale(input: {
  cookieHeader?: string | null;
  acceptLanguage?: string | string[] | null;
  locale?: unknown;
}): AppLocale {
  const fromRequest =
    typeof input.locale === 'string' ? normalizeLocale(input.locale) : null;
  return (
    fromRequest ??
    readLocaleFromCookieHeader(input.cookieHeader) ??
    readLocaleFromAcceptLanguage(input.acceptLanguage) ??
    DEFAULT_LOCALE
  );
}
