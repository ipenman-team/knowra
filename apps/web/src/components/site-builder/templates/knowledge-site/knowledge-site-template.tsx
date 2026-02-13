'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  SiteTemplateRendererProps,
  SiteTemplateRenderData,
} from '../template.types';
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

function formatDateTime(input?: string | Date | null): string {
  if (!input) return '';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString();
}

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
  const [activeMenu, setActiveMenu] =
    useState<(typeof MENU_ORDER)[number]>('home');
  const [selectedBlogPageId, setSelectedBlogPageId] = useState<string | null>(
    null,
  );

  const enabledMenus = useMemo(() => getEnabledMenus(data), [data]);

  useEffect(() => {
    if (!enabledMenus.length) return;
    if (!enabledMenus.includes(activeMenu)) {
      setActiveMenu(enabledMenus[0]);
    }
  }, [activeMenu, enabledMenus]);

  useEffect(() => {
    if (!data.menuData.blog.items.length) {
      setSelectedBlogPageId(null);
      return;
    }
    setSelectedBlogPageId((prev) => {
      if (!prev) return null;
      return data.menuData.blog.items.some((item) => item.id === prev)
        ? prev
        : null;
    });
  }, [data.menuData.blog.items]);

  useEffect(() => {
    if (!onRequestPage) return;
    if (activeMenu === 'home') {
      onRequestPage(data.menuData.homePageId);
      return;
    }
    if (activeMenu === 'about') {
      onRequestPage(data.menuData.aboutPageId);
      return;
    }
    if (activeMenu === 'contact') {
      onRequestPage(data.menuData.contactPageId);
      return;
    }
    if (activeMenu === 'blog') {
      onRequestPage(selectedBlogPageId);
    }
  }, [
    activeMenu,
    data.menuData.aboutPageId,
    data.menuData.contactPageId,
    data.menuData.homePageId,
    onRequestPage,
    selectedBlogPageId,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">
              {data.siteName}
            </div>
          </div>
          <nav className="min-w-0 overflow-x-auto">
            <div className="flex items-center gap-1 whitespace-nowrap">
              {enabledMenus.map((menu) => (
                <Button
                  key={menu}
                  variant="link"
                  onClick={() => {
                    setActiveMenu(menu);
                    if (menu === 'blog') setSelectedBlogPageId(null);
                  }}
                  className={cn(
                    'rounded-none',
                    activeMenu === menu &&
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
          {activeMenu === 'home' ? (
            <KnowledgeHomeMenu
              pageId={data.menuData.homePageId}
              pageMap={data.pageMap}
            />
          ) : null}

          {activeMenu === 'about' ? (
            <KnowledgeAboutMenu
              pageId={data.menuData.aboutPageId}
              pageMap={data.pageMap}
            />
          ) : null}

          {activeMenu === 'contact' ? (
            <KnowledgeContactMenu
              pageId={data.menuData.contactPageId}
              pageMap={data.pageMap}
            />
          ) : null}

          {activeMenu === 'blog' ? (
            <KnowledgeBlogMenu
              style={data.menuData.blog.style}
              items={data.menuData.blog.items}
              pageMap={data.pageMap}
              selectedPageId={selectedBlogPageId}
              onSelectPageId={setSelectedBlogPageId}
            />
          ) : null}

          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            {data.footerText ?? 'Powered by Contexta'}
          </div>
        </div>
      </main>
    </div>
  );
}
