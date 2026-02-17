'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ListTreeIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpaceRoute } from '@/lib/navigation';
import { useActivePage } from '@/stores/page-store';
import { useCurrentSpaceId, useSpaces } from '@/stores';
import { useMobileSidebarController } from '@/stores/mobile-sidebar-controller-store';
import { useI18n } from '@/lib/i18n/provider';

type SecondarySlot = {
  id: 'space' | 'favorites' | 'contexta-ai';
};

function getSecondarySlot(pathname: string): SecondarySlot | null {
  if (pathname.startsWith('/spaces/')) {
    return { id: 'space' };
  }
  if (pathname.startsWith('/favorites')) {
    return { id: 'favorites' };
  }
  if (pathname.startsWith('/contexta-ai')) {
    return { id: 'contexta-ai' };
  }
  return null;
}

function getTitle(pathname: string, params: {
  pageTitle: string | null;
  spaceName: string | null;
  fallbackTitle: string;
  trashTitle: string;
  favoritesTitle: string;
  contextaAiTitle: string;
  workbenchTitle: string;
}): string {
  if (pathname.startsWith('/spaces/trash')) return params.trashTitle;
  if (pathname.startsWith('/spaces/')) {
    return params.pageTitle ?? params.spaceName ?? params.fallbackTitle;
  }
  if (pathname.startsWith('/favorites')) return params.favoritesTitle;
  if (pathname.startsWith('/contexta-ai')) return params.contextaAiTitle;
  if (pathname.startsWith('/workbench')) return params.workbenchTitle;
  return params.fallbackTitle;
}

export function MobileTopNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const rootController = useMobileSidebarController('root');
  const spaceController = useMobileSidebarController('space');
  const favoritesController = useMobileSidebarController('favorites');
  const contextaAiController = useMobileSidebarController('contexta-ai');

  const routeSpaceId = useSpaceRoute();
  const currentSpaceId = useCurrentSpaceId();
  const spaces = useSpaces();
  const activePage = useActivePage();

  const spaceId = routeSpaceId ?? currentSpaceId;
  const activeSpace = useMemo(
    () => spaces.find((s) => s.id === spaceId) ?? null,
    [spaceId, spaces],
  );
  const pageTitle = activePage?.title?.trim() || null;
  const spaceName = activeSpace?.name?.trim() || null;

  const secondarySlot = getSecondarySlot(pathname);
  const secondaryController =
    secondarySlot?.id === 'space'
      ? spaceController
      : secondarySlot?.id === 'favorites'
        ? favoritesController
        : secondarySlot?.id === 'contexta-ai'
          ? contextaAiController
          : undefined;

  const title = getTitle(pathname, {
    pageTitle,
    spaceName,
    fallbackTitle: t('mobile.defaultTitle'),
    trashTitle: t('mobile.trash'),
    favoritesTitle: t('mobile.myFavorites'),
    contextaAiTitle: t('mobile.contextaAi'),
    workbenchTitle: t('mobile.workbench'),
  });

  if (!rootController?.isMobile) return null;

  const hasSecondary = Boolean(
    secondarySlot && secondaryController && secondaryController.isMobile,
  );

  const secondaryTextById: Record<SecondarySlot['id'], string> = {
    space: t('mobile.space'),
    favorites: t('mobile.favorites'),
    'contexta-ai': t('mobile.conversation'),
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="grid h-12 grid-cols-[auto_1fr_auto] items-center gap-2 px-3">
        <Button
          type="button"
          variant={rootController.openMobile ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('h-8 gap-1 px-2')}
          aria-label={rootController.label}
          onClick={rootController.toggle}
        >
          <MenuIcon className="h-4 w-4" />
          <span className="text-xs">{t('mobile.module')}</span>
        </Button>

        <div className="min-w-0 px-2 text-center text-sm font-medium">
          <span className="block truncate">{title}</span>
        </div>

        {hasSecondary && secondarySlot && secondaryController ? (
          <Button
            type="button"
            variant={secondaryController.openMobile ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('h-8 gap-1 px-2')}
            aria-label={secondaryController.label}
            onClick={secondaryController.toggle}
          >
            <ListTreeIcon className="h-4 w-4" />
            <span className="text-xs">{secondaryTextById[secondarySlot.id]}</span>
          </Button>
        ) : (
          <div className="h-8 w-[4.75rem]" />
        )}
      </div>
    </div>
  );
}
