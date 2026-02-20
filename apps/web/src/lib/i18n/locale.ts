export type AppLocale = 'zh-CN' | 'en-US';

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
export const SUPPORTED_LOCALES: readonly AppLocale[] = ['zh-CN', 'en-US'];
export const LOCALE_COOKIE_KEY = 'knowra_locale';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(input: string | null | undefined): AppLocale | null {
  if (!input) return null;
  const value = input.trim();
  if (isSupportedLocale(value)) return value;

  const lower = value.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('en')) return 'en-US';
  return null;
}

function parseCookieValue(cookieHeader: string, key: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const item = part.trim();
    if (!item.startsWith(`${key}=`)) continue;
    return item.slice(key.length + 1) || null;
  }
  return null;
}

export function readLocaleFromCookieHeader(
  cookieHeader: string | null | undefined,
): AppLocale | null {
  if (!cookieHeader) return null;
  const cookieValue = parseCookieValue(cookieHeader, LOCALE_COOKIE_KEY);
  return normalizeLocale(cookieValue);
}

export function readLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): AppLocale | null {
  if (!acceptLanguage) return null;
  const primary = acceptLanguage.split(',')[0]?.trim() ?? '';
  return normalizeLocale(primary);
}

export function resolveLocale(options?: {
  cookieHeader?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  return (
    readLocaleFromCookieHeader(options?.cookieHeader) ??
    readLocaleFromAcceptLanguage(options?.acceptLanguage) ??
    DEFAULT_LOCALE
  );
}

export function readLocaleFromDocumentCookie(): AppLocale | null {
  if (typeof document === 'undefined') return null;
  return readLocaleFromCookieHeader(document.cookie);
}

export function getCurrentLocale(): AppLocale {
  return readLocaleFromDocumentCookie() ?? DEFAULT_LOCALE;
}

export function setLocaleCookie(locale: AppLocale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
