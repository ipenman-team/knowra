'use client';

import { useMemo } from 'react';
import {
  SiteTemplateRenderer,
  type SiteTemplatePage,
  type SiteTemplateRenderData,
} from '@/components/site-builder/templates';
import type { SiteBuilderConfig } from '@/lib/api/site-builder';

type ResolvedData = {
  pageMap?: Record<string, SiteTemplatePage>;
  menuData?: {
    home?: { pageId: string | null };
    about?: { pageId: string | null };
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

function parsePayload(payload: unknown): SnapshotPayload | null {
  if (!isObjectLike(payload)) return null;
  if (payload.mode !== 'site-builder') return null;
  if (!isObjectLike(payload.space) || !isObjectLike(payload.siteConfig)) return null;

  const spaceName = toTrimmedString(payload.space.name) ?? '站点展示';
  const themeRaw = isObjectLike(payload.siteConfig.theme) ? payload.siteConfig.theme : {};
  const menusRaw = isObjectLike(payload.siteConfig.menus) ? payload.siteConfig.menus : {};
  const blogRaw = isObjectLike(menusRaw.blog) ? menusRaw.blog : {};

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
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    resolvedData: {
      pageMap,
      menuData,
    },
  };
}

export function PublicSiteViewer({
  snapshot,
}: {
  snapshot: { payload?: unknown; createdAt?: string } | null;
}) {
  const payload = useMemo(() => parsePayload(snapshot?.payload), [snapshot?.payload]);

  const renderData = useMemo<SiteTemplateRenderData | null>(() => {
    if (!payload) return null;

    return {
      template: payload.siteConfig.template,
      siteName: payload.space.name,
      publishedAt: snapshot?.createdAt ?? null,
      menus: payload.siteConfig.menus,
      pageMap: payload.resolvedData?.pageMap ?? {},
      menuData: {
        homePageId: payload.resolvedData?.menuData?.home?.pageId ?? null,
        aboutPageId: payload.resolvedData?.menuData?.about?.pageId ?? null,
        contactPageId: payload.resolvedData?.menuData?.contact?.pageId ?? null,
        blog: {
          style:
            payload.resolvedData?.menuData?.blog?.style ?? payload.siteConfig.menus.blog.style,
          items: payload.resolvedData?.menuData?.blog?.items ?? [],
        },
      },
      footerText: 'Powered by Contexta',
    };
  }, [payload, snapshot?.createdAt]);

  if (!renderData) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        站点配置异常，无法渲染。
      </div>
    );
  }

  return <SiteTemplateRenderer data={renderData} />;
}
