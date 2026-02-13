'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  SiteTemplateRendererProps,
  SiteTemplateRenderData,
} from '../template.types';
import { KnowledgePageMenuBase } from './menus/page-menu-base';
import { KnowledgeAboutMenu } from './menus/about-menu';
import { KnowledgeBlogMenu } from './menus/blog-menu';
import { KnowledgeContactMenu } from './menus/contact-menu';
import { KnowledgeHomeMenu } from './menus/home-menu';
import { Button } from '@/components/ui/button';

const MENU_ORDER = ['home', 'about', 'blog', 'contact'] as const;
const MENU_LABEL: Record<(typeof MENU_ORDER)[number], string> = {
  home: 'Home',
  about: 'About',
  blog: 'Blog',
  contact: 'Contact',
};

function getEnabledMenus(data: SiteTemplateRenderData) {
  return MENU_ORDER.filter((menu) => {
    if (menu === 'blog') return data.menus.blog.enabled;
    return data.menus[menu].enabled;
  });
}

export function KnowledgeSiteTemplate({
  data,
  onRequestPage,
}: SiteTemplateRendererProps) {
  const customMenus = useMemo(() => {
    const primary = data.menuData.customMenus.length
      ? data.menuData.customMenus
      : data.customMenus;
    const seen = new Set<string>();
    return primary.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data.customMenus, data.menuData.customMenus]);
  const hasCustomMenus = customMenus.length > 0;

  const [activeMenu, setActiveMenu] =
    useState<(typeof MENU_ORDER)[number]>('home');
  const [activeCustomMenuId, setActiveCustomMenuId] = useState<string | null>(
    null,
  );
  const [selectedCustomListPageId, setSelectedCustomListPageId] = useState<
    string | null
  >(null);
  const [selectedBlogPageId, setSelectedBlogPageId] = useState<string | null>(
    null,
  );

  const enabledMenus = useMemo(() => getEnabledMenus(data), [data]);

  const resolvedActiveMenu = useMemo<(typeof MENU_ORDER)[number] | null>(() => {
    if (hasCustomMenus) return null;
    if (!enabledMenus.length) return null;
    return enabledMenus.includes(activeMenu) ? activeMenu : enabledMenus[0];
  }, [activeMenu, enabledMenus, hasCustomMenus]);

  const resolvedActiveCustomMenuId = useMemo(() => {
    if (!hasCustomMenus) return null;
    if (!customMenus.length) return null;
    return customMenus.some((item) => item.id === activeCustomMenuId)
      ? activeCustomMenuId
      : customMenus[0].id;
  }, [activeCustomMenuId, customMenus, hasCustomMenus]);

  const resolvedSelectedBlogPageId = useMemo(() => {
    if (hasCustomMenus) return null;
    if (!data.menuData.blog.items.length) return null;
    if (!selectedBlogPageId) return null;
    return data.menuData.blog.items.some((item) => item.id === selectedBlogPageId)
      ? selectedBlogPageId
      : null;
  }, [data.menuData.blog.items, hasCustomMenus, selectedBlogPageId]);

  const activeCustomMenu = useMemo(() => {
    if (!hasCustomMenus) return null;
    if (!resolvedActiveCustomMenuId) return customMenus[0] ?? null;
    return (
      customMenus.find((item) => item.id === resolvedActiveCustomMenuId) ?? null
    );
  }, [customMenus, hasCustomMenus, resolvedActiveCustomMenuId]);

  const activeCustomListItems = useMemo(() => {
    if (!activeCustomMenu || activeCustomMenu.type !== 'PAGE_LIST') return [];
    const selectedPages = activeCustomMenu.pageIds
      .map((pageId) => data.pageMap[pageId])
      .filter(Boolean) as Array<SiteTemplateRenderData['pageMap'][string]>;
    return selectedPages.map((page) => ({
        id: page.id,
        title: page.title,
        updatedAt: page.updatedAt,
        coverUrl: activeCustomMenu.pageCovers[page.id] ?? null,
      }));
  }, [activeCustomMenu, data.pageMap]);

  const resolvedSelectedCustomListPageId = useMemo(() => {
    if (!activeCustomMenu || activeCustomMenu.type !== 'PAGE_LIST') return null;
    if (!activeCustomListItems.length) return null;
    if (!selectedCustomListPageId) return null;
    return activeCustomListItems.some((item) => item.id === selectedCustomListPageId)
      ? selectedCustomListPageId
      : null;
  }, [activeCustomListItems, activeCustomMenu, selectedCustomListPageId]);

  useEffect(() => {
    if (!onRequestPage) return;
    if (activeCustomMenu) {
      if (activeCustomMenu.type === 'PAGE_LIST') {
        onRequestPage(resolvedSelectedCustomListPageId);
        return;
      }
      onRequestPage(activeCustomMenu.pageId ?? null);
      return;
    }
    if (resolvedActiveMenu === 'home') {
      onRequestPage(data.menuData.homePageId);
      return;
    }
    if (resolvedActiveMenu === 'about') {
      onRequestPage(data.menuData.aboutPageId);
      return;
    }
    if (resolvedActiveMenu === 'contact') {
      onRequestPage(data.menuData.contactPageId);
      return;
    }
    if (resolvedActiveMenu === 'blog') {
      onRequestPage(resolvedSelectedBlogPageId);
    }
  }, [
    activeCustomMenu,
    data.menuData.aboutPageId,
    data.menuData.contactPageId,
    data.menuData.homePageId,
    onRequestPage,
    resolvedActiveMenu,
    resolvedSelectedCustomListPageId,
    resolvedSelectedBlogPageId,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {data.branding.logoUrl ? (
              <Image
                src={data.branding.logoUrl}
                alt="Site logo"
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-md border object-contain"
              />
            ) : null}
            <div className="truncate text-lg font-semibold">{data.siteName}</div>
          </div>
          <nav className="min-w-0 overflow-x-auto">
            <div className="flex items-center gap-1 whitespace-nowrap">
              {hasCustomMenus
                ? customMenus.map((menu) => (
                    <Button
                      key={menu.id}
                      variant="link"
                      onClick={() => {
                        setActiveCustomMenuId(menu.id);
                        setSelectedCustomListPageId(null);
                      }}
                      className={cn(
                        'rounded-none',
                        resolvedActiveCustomMenuId === menu.id &&
                          'border-b-2 border-foreground text-foreground',
                      )}
                    >
                      {menu.label}
                    </Button>
                  ))
                : enabledMenus.map((menu) => (
                    <Button
                      key={menu}
                      variant="link"
                      onClick={() => {
                        setActiveMenu(menu);
                        if (menu === 'blog') setSelectedBlogPageId(null);
                      }}
                      className={cn(
                        'rounded-none',
                        resolvedActiveMenu === menu &&
                          'border-b-2 border-foreground text-foreground',
                      )}
                    >
                      {MENU_LABEL[menu]}
                    </Button>
                  ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-4 px-6 pb-20 pt-8">
          {hasCustomMenus ? (
            activeCustomMenu?.type === 'PAGE_LIST' ? (
              <KnowledgeBlogMenu
                style={activeCustomMenu.style}
                items={activeCustomListItems}
                pageMap={data.pageMap}
                selectedPageId={resolvedSelectedCustomListPageId}
                onSelectPageId={setSelectedCustomListPageId}
              />
            ) : (
              <KnowledgePageMenuBase
                pageId={activeCustomMenu?.pageId ?? null}
                pageMap={data.pageMap}
                emptyText={
                  activeCustomMenu
                    ? `菜单“${activeCustomMenu.label}”未绑定页面。`
                    : '尚未配置菜单。'
                }
              />
            )
          ) : (
            <>
              {resolvedActiveMenu === 'home' ? (
                <KnowledgeHomeMenu
                  pageId={data.menuData.homePageId}
                  pageMap={data.pageMap}
                />
              ) : null}

              {resolvedActiveMenu === 'about' ? (
                <KnowledgeAboutMenu
                  pageId={data.menuData.aboutPageId}
                  pageMap={data.pageMap}
                />
              ) : null}

              {resolvedActiveMenu === 'contact' ? (
                <KnowledgeContactMenu
                  pageId={data.menuData.contactPageId}
                  pageMap={data.pageMap}
                />
              ) : null}

              {resolvedActiveMenu === 'blog' ? (
                <KnowledgeBlogMenu
                  style={data.menuData.blog.style}
                  items={data.menuData.blog.items}
                  pageMap={data.pageMap}
                  selectedPageId={resolvedSelectedBlogPageId}
                  onSelectPageId={setSelectedBlogPageId}
                />
              ) : null}
            </>
          )}

          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            {data.footerText ?? 'Powered by Contexta'}
          </div>
        </div>
      </main>
    </div>
  );
}
