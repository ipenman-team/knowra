export type LandingLocale = 'zh' | 'en';

export const LANDING_LOCALE_QUERY_KEY = 'lang';

export function resolveLandingLocale(value: string | string[] | undefined): LandingLocale {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'en' ? 'en' : 'zh';
}

export function withLandingLocale(href: string, locale: LandingLocale): string {
  const [pathAndQuery, hash] = href.split('#');
  const [pathname, query] = (pathAndQuery ?? '').split('?');
  const searchParams = new URLSearchParams(query ?? '');

  searchParams.set(LANDING_LOCALE_QUERY_KEY, locale);

  const nextQuery = searchParams.toString();
  const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;

  return hash ? `${nextPath}#${hash}` : nextPath;
}
