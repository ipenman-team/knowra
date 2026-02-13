import { pagesApi } from '@/lib/api';
import type { ShareDto } from '@/lib/api';
import type { PageDto } from '@/lib/api/pages/types';
import type {
  SiteBuilderConfig,
  SiteBuilderCustomMenu,
  SiteBuilderCustomMenuType,
} from '@/lib/api/site-builder';

export type AccessMode = 'public' | 'password';
export type ExpirePreset = 'never' | '7d' | '30d';

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_BATCH_SIZE = 200;
const PAGE_FETCH_LIMIT = 1000;

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
export const SITE_BUILDER_AUTOSAVE_DEBOUNCE_MS = 500;

export function toTrimmedString(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return value ? value : null;
}

export function expirePresetFromDate(expiresAt?: string | null): ExpirePreset {
  if (!expiresAt) return 'never';
  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) return 'never';

  const diffDays = Math.round((ts - Date.now()) / DAY_MS);
  if (diffDays >= 6 && diffDays <= 8) return '7d';
  if (diffDays >= 29 && diffDays <= 31) return '30d';
  return 'never';
}

export function dateFromExpirePreset(preset: ExpirePreset): string | null {
  if (preset === 'never') return null;
  const days = preset === '7d' ? 7 : 30;
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

export function modeFromShare(share: ShareDto): AccessMode {
  return share.visibility === 'RESTRICTED' ? 'password' : 'public';
}

function normalizeCustomMenuType(input: unknown): SiteBuilderCustomMenuType {
  return input === 'PAGE_LIST' ? 'PAGE_LIST' : 'SINGLE_PAGE';
}

function normalizeCustomMenuStyle(input: unknown): 'list' | 'card' {
  return input === 'list' ? 'list' : 'card';
}

function normalizePageCoverMap(
  input: unknown,
  allowedPageIds: string[],
): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const allowed = new Set(allowedPageIds);
  return Object.fromEntries(
    Object.entries(input)
      .map(([pageId, coverUrl]) => [
        toTrimmedString(pageId),
        toTrimmedString(coverUrl),
      ] as const)
      .filter(
        (entry): entry is [string, string] =>
          entry[0] !== null &&
          entry[1] !== null &&
          entry[1].length > 0 &&
          allowed.has(entry[0]),
      ),
  );
}

export function createDefaultSiteBuilderConfig(): SiteBuilderConfig {
  const now = new Date().toISOString();
  return {
    version: 1,
    template: 'knowledge-site',
    theme: {
      mode: 'light',
      primaryColor: '#2563eb',
    },
    menus: {
      home: { enabled: true, pageId: null },
      about: { enabled: false, pageId: null },
      blog: {
        enabled: true,
        source: 'LATEST_PUBLISHED',
        style: 'card',
        pageIds: [],
        limit: 6,
      },
      contact: { enabled: false, pageId: null },
    },
    customMenus: [
      {
        id: 'menu-home',
        label: 'Home',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: null,
        pageIds: [],
        pageCovers: {},
      },
    ],
    branding: {
      logoUrl: null,
    },
    updatedAt: now,
    updatedBy: 'current-user',
  };
}

function dedupeCustomMenus(
  input: SiteBuilderCustomMenu[],
): SiteBuilderCustomMenu[] {
  const seen = new Set<string>();
  const menus: SiteBuilderCustomMenu[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    const id = toTrimmedString(item.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const fallbackPageId =
      toTrimmedString(item.pageId) ??
      (Array.isArray(item.pageIds)
        ? item.pageIds
            .map((menuPageId) => toTrimmedString(menuPageId))
            .find((menuPageId): menuPageId is string => Boolean(menuPageId)) ??
          null
        : null);
    const type = normalizeCustomMenuType(item.type);
    const style = normalizeCustomMenuStyle(item.style);
    const normalizedPageIds = Array.isArray(item.pageIds)
      ? Array.from(
          new Set(
            item.pageIds
              .map((menuPageId) => toTrimmedString(menuPageId))
              .filter((menuPageId): menuPageId is string => Boolean(menuPageId)),
          ),
        )
      : [];
    const pageCovers =
      type === 'PAGE_LIST'
        ? normalizePageCoverMap(item.pageCovers, normalizedPageIds)
        : {};
    menus.push({
      id,
      label: toTrimmedString(item.label) ?? `Menu ${menus.length + 1}`,
      type,
      style,
      pageId: type === 'SINGLE_PAGE' ? fallbackPageId : null,
      pageIds: type === 'PAGE_LIST' ? normalizedPageIds : [],
      pageCovers,
    });
  }
  return menus;
}

function fallbackMenusFromLegacy(
  config: Partial<SiteBuilderConfig>,
): SiteBuilderCustomMenu[] {
  const menus = config.menus;
  if (!menus) {
    return [
      {
        id: 'menu-home',
        label: 'Home',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: null,
        pageIds: [],
        pageCovers: {},
      },
    ];
  }

  const fallback: SiteBuilderCustomMenu[] = [];
  if (menus.home?.enabled) {
    fallback.push({
      id: 'menu-home',
      label: 'Home',
      type: 'SINGLE_PAGE',
      style: 'card',
      pageId: toTrimmedString(menus.home.pageId),
      pageIds: [],
      pageCovers: {},
    });
  }
  if (menus.about?.enabled) {
    fallback.push({
      id: 'menu-about',
      label: 'About',
      type: 'SINGLE_PAGE',
      style: 'card',
      pageId: toTrimmedString(menus.about.pageId),
      pageIds: [],
      pageCovers: {},
    });
  }
  if (menus.contact?.enabled) {
    fallback.push({
      id: 'menu-contact',
      label: 'Contact',
      type: 'SINGLE_PAGE',
      style: 'card',
      pageId: toTrimmedString(menus.contact.pageId),
      pageIds: [],
      pageCovers: {},
    });
  }
  return fallback.length
    ? fallback
    : [
        {
          id: 'menu-home',
          label: 'Home',
          type: 'SINGLE_PAGE',
          style: 'card',
          pageId: null,
          pageIds: [],
          pageCovers: {},
        },
      ];
}

export function normalizeSiteBuilderConfig(
  input: SiteBuilderConfig | null | undefined,
): SiteBuilderConfig {
  const defaults = createDefaultSiteBuilderConfig();
  const source = (input ?? defaults) as Partial<SiteBuilderConfig>;
  const sourceMenus = source.menus ?? defaults.menus;

  const normalizedCustomMenus = dedupeCustomMenus(
    Array.isArray(source.customMenus)
      ? source.customMenus
      : fallbackMenusFromLegacy(source),
  );

  return {
    version: 1,
    template: 'knowledge-site',
    theme: {
      mode:
        source.theme?.mode === 'dark' || source.theme?.mode === 'system'
          ? source.theme.mode
          : 'light',
      primaryColor:
        toTrimmedString(source.theme?.primaryColor) ??
        defaults.theme.primaryColor,
    },
    menus: {
      home: {
        enabled:
          sourceMenus.home?.enabled ?? defaults.menus.home.enabled,
        pageId: toTrimmedString(sourceMenus.home?.pageId),
      },
      about: {
        enabled:
          sourceMenus.about?.enabled ?? defaults.menus.about.enabled,
        pageId: toTrimmedString(sourceMenus.about?.pageId),
      },
      blog: {
        enabled:
          sourceMenus.blog?.enabled ?? defaults.menus.blog.enabled,
        source:
          sourceMenus.blog?.source === 'MANUAL_PAGE_IDS'
            ? 'MANUAL_PAGE_IDS'
            : 'LATEST_PUBLISHED',
        style:
          sourceMenus.blog?.style === 'list' ? 'list' : 'card',
        pageIds: Array.isArray(sourceMenus.blog?.pageIds)
          ? sourceMenus.blog.pageIds
              .map((id) => toTrimmedString(id))
              .filter((id): id is string => Boolean(id))
          : [],
        limit: Number.isFinite(Number(sourceMenus.blog?.limit))
          ? Number(sourceMenus.blog?.limit)
          : defaults.menus.blog.limit,
      },
      contact: {
        enabled:
          sourceMenus.contact?.enabled ?? defaults.menus.contact.enabled,
        pageId: toTrimmedString(sourceMenus.contact?.pageId),
      },
    },
    customMenus: normalizedCustomMenus.length
      ? normalizedCustomMenus
      : defaults.customMenus,
    branding: {
      logoUrl: toTrimmedString(source.branding?.logoUrl),
    },
    updatedAt: source.updatedAt ?? defaults.updatedAt,
    updatedBy: source.updatedBy ?? defaults.updatedBy,
  };
}

export function buildSiteBuilderSignature(config: SiteBuilderConfig): string {
  const normalized = normalizeSiteBuilderConfig(config);
  return JSON.stringify({
    ...normalized,
    updatedAt: '',
    updatedBy: '',
  });
}

export async function listSpacePagesForSnapshot(spaceId: string) {
  const pages: Array<{
    id: string;
    title: string;
    parentIds: string[];
    latestPublishedVersionId?: string | null;
    updatedAt: string;
  }> = [];

  let skip = 0;
  while (skip < PAGE_FETCH_LIMIT) {
    const batch = await pagesApi.list(spaceId, {
      skip,
      take: PAGE_BATCH_SIZE,
    });
    if (!batch.length) break;

    pages.push(
      ...batch.map((item) => ({
        id: item.id,
        title: item.title,
        parentIds: item.parentIds ?? [],
        latestPublishedVersionId: item.latestPublishedVersionId ?? null,
        updatedAt: item.updatedAt,
      })),
    );

    if (batch.length < PAGE_BATCH_SIZE) break;
    skip += batch.length;
  }

  return pages;
}

export async function listSpacePagesForPicker(spaceId: string): Promise<PageDto[]> {
  const pages: PageDto[] = [];
  let skip = 0;

  while (skip < PAGE_FETCH_LIMIT) {
    const batch = await pagesApi.list(spaceId, {
      skip,
      take: PAGE_BATCH_SIZE,
    });
    if (!batch.length) break;

    pages.push(...batch);
    if (batch.length < PAGE_BATCH_SIZE) break;
    skip += batch.length;
  }

  return pages;
}
