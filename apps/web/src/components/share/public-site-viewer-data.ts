import type {
  SiteTemplatePage,
  SiteTemplateRenderData,
} from '@/components/site-builder/templates';
import type {
  SiteBuilderConfig,
  SiteBuilderCustomMenu,
} from '@/lib/api/site-builder';
import { ICP_FILING_NUMBER } from '@/lib/filing';

type ResolvedData = {
  pageMap?: Record<string, SiteTemplatePage>;
  menuData?: {
    home?: { pageId: string | null };
    about?: { pageId: string | null };
    customMenus?: SiteBuilderCustomMenu[];
    blog?: {
      style: 'list' | 'card';
      items: Array<{ id: string; title: string; updatedAt: string }>;
    };
    contact?: { pageId: string | null };
  };
};

type SnapshotPayload = {
  mode: 'site-builder';
  space: {
    id: string;
    name: string;
    description?: string | null;
  };
  siteConfig: SiteBuilderConfig;
  resolvedData?: ResolvedData;
};

function isObjectLike(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function toTrimmedString(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return value ? value : null;
}

function toBoolean(input: unknown, fallback: boolean): boolean {
  if (typeof input === 'boolean') return input;
  return fallback;
}

function parseCustomMenus(input: unknown): SiteBuilderCustomMenu[] {
  if (!Array.isArray(input)) return [];
  const items: SiteBuilderCustomMenu[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < input.length; index += 1) {
    const raw = input[index];
    if (!isObjectLike(raw)) continue;
    const id = toTrimmedString(raw.id);
    if (!id || seen.has(id)) continue;
    const label = toTrimmedString(raw.label) ?? `Menu ${items.length + 1}`;
    const style = raw.style === 'list' ? 'list' : 'card';
    const pageIds = Array.isArray(raw.pageIds)
      ? Array.from(
          new Set(
            raw.pageIds
              .map((pageIdValue) => toTrimmedString(pageIdValue))
              .filter((pageIdValue): pageIdValue is string => Boolean(pageIdValue)),
          ),
        )
      : [];
    const pageCovers =
      raw.pageCovers && typeof raw.pageCovers === 'object' && !Array.isArray(raw.pageCovers)
        ? Object.fromEntries(
            Object.entries(raw.pageCovers)
              .map(([pageId, coverUrl]) => [
                toTrimmedString(pageId),
                toTrimmedString(coverUrl),
              ] as const)
              .filter(
                (entry): entry is [string, string] =>
                  entry[0] !== null &&
                  entry[1] !== null &&
                  entry[1].length > 0 &&
                  pageIds.includes(entry[0]),
              ),
          )
        : {};
    const explicitType = raw.type === 'PAGE_LIST' ? 'PAGE_LIST' : 'SINGLE_PAGE';
    const pageIdRaw = toTrimmedString(raw.pageId);
    const type =
      explicitType === 'PAGE_LIST' || (!pageIdRaw && pageIds.length)
        ? 'PAGE_LIST'
        : 'SINGLE_PAGE';
    const pageId = type === 'SINGLE_PAGE' ? pageIdRaw : null;
    seen.add(id);
    items.push({
      id,
      label,
      type,
      style,
      pageId,
      pageIds: type === 'PAGE_LIST' ? pageIds : [],
      pageCovers: type === 'PAGE_LIST' ? pageCovers : {},
    });
  }

  return items;
}

function parsePayload(payload: unknown): SnapshotPayload | null {
  if (!isObjectLike(payload)) return null;
  if (payload.mode !== 'site-builder') return null;
  if (!isObjectLike(payload.space) || !isObjectLike(payload.siteConfig)) return null;

  const spaceName = toTrimmedString(payload.space.name) ?? '站点展示';
  const themeRaw = isObjectLike(payload.siteConfig.theme) ? payload.siteConfig.theme : {};
  const menusRaw = isObjectLike(payload.siteConfig.menus) ? payload.siteConfig.menus : {};
  const blogRaw = isObjectLike(menusRaw.blog) ? menusRaw.blog : {};
  const brandingRaw = isObjectLike(payload.siteConfig.branding)
    ? payload.siteConfig.branding
    : {};
  const customMenusRaw = parseCustomMenus(payload.siteConfig.customMenus);

  const safePageMenu = (raw: unknown) => {
    const menu = isObjectLike(raw) ? raw : {};
    return {
      enabled: toBoolean(menu.enabled, false),
      pageId: toTrimmedString(menu.pageId),
    };
  };

  const resolvedData = isObjectLike(payload.resolvedData) ? payload.resolvedData : {};
  const pageMap = isObjectLike(resolvedData.pageMap)
    ? (resolvedData.pageMap as Record<string, SiteTemplatePage>)
    : {};
  const menuData = isObjectLike(resolvedData.menuData)
    ? (resolvedData.menuData as ResolvedData['menuData'])
    : {};
  const resolvedCustomMenus = parseCustomMenus(menuData?.customMenus);

  return {
    mode: 'site-builder',
    space: {
      id: toTrimmedString(payload.space.id) ?? 'unknown-space',
      name: spaceName,
      description: toTrimmedString(payload.space.description),
    },
    siteConfig: {
      version: 1,
      template: 'knowledge-site',
      theme: {
        mode:
          themeRaw.mode === 'dark' || themeRaw.mode === 'system'
            ? themeRaw.mode
            : 'light',
        primaryColor: toTrimmedString(themeRaw.primaryColor) ?? '#2563eb',
      },
      menus: {
        home: safePageMenu(menusRaw.home),
        about: safePageMenu(menusRaw.about),
        blog: {
          enabled: toBoolean(blogRaw.enabled, true),
          source: blogRaw.source === 'MANUAL_PAGE_IDS' ? 'MANUAL_PAGE_IDS' : 'LATEST_PUBLISHED',
          style: blogRaw.style === 'list' ? 'list' : 'card',
          pageIds: Array.isArray(blogRaw.pageIds)
            ? blogRaw.pageIds
                .map((id) => toTrimmedString(id))
                .filter((id): id is string => Boolean(id))
            : [],
          limit: Number.isFinite(Number(blogRaw.limit)) ? Number(blogRaw.limit) : 6,
        },
        contact: safePageMenu(menusRaw.contact),
      },
      customMenus: customMenusRaw,
      branding: {
        logoUrl: toTrimmedString(brandingRaw.logoUrl),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    resolvedData: {
      pageMap,
      menuData: {
        ...menuData,
        customMenus: resolvedCustomMenus,
      },
    },
  };
}

export function buildRenderDataFromSnapshot(snapshot: {
  payload?: unknown;
  createdAt?: string;
} | null): SiteTemplateRenderData | null {
  const payload = parsePayload(snapshot?.payload);
  if (!payload) return null;

  return {
    template: payload.siteConfig.template,
    siteName: payload.space.name,
    publishedAt: snapshot?.createdAt ?? null,
    menus: payload.siteConfig.menus,
    customMenus: payload.siteConfig.customMenus,
    branding: payload.siteConfig.branding,
    pageMap: payload.resolvedData?.pageMap ?? {},
    menuData: {
      homePageId: payload.resolvedData?.menuData?.home?.pageId ?? null,
      aboutPageId: payload.resolvedData?.menuData?.about?.pageId ?? null,
      contactPageId: payload.resolvedData?.menuData?.contact?.pageId ?? null,
      customMenus:
        payload.resolvedData?.menuData?.customMenus ?? payload.siteConfig.customMenus,
      blog: {
        style: payload.resolvedData?.menuData?.blog?.style ?? payload.siteConfig.menus.blog.style,
        items: payload.resolvedData?.menuData?.blog?.items ?? [],
      },
    },
    footerText: ICP_FILING_NUMBER,
  };
}
