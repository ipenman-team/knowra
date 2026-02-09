"use client";

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import {
  usePageSelectionStore,
  usePageTreeStore,
  usePagesStore,
  useSelectedPageId,
  useTreePages,
  useTreePagesHasMore,
  useTreePagesLoading,
} from '@/stores';
import { useRequiredSpaceId } from '@/hooks/use-required-space';
import type { PageDto } from '@/lib/api';

type DirectoryListProps = {
  spaceId: string;
  autoSelectFirst?: boolean;
  clearOnEmptySpace?: boolean;
  query?: string;
  parentId?: string | null;
  onlyRoots?: boolean;
  pageSize?: number;
  autoLoadAll?: boolean;
  routingEnabled?: boolean;
  onLoaded?: (pages: PageDto[]) => void;
};

export default function DirectoryList({
  spaceId,
  autoSelectFirst = true,
  clearOnEmptySpace = true,
  query,
  parentId,
  onlyRoots = false,
  pageSize = 200,
  autoLoadAll = false,
  routingEnabled = true,
  onLoaded,
}: DirectoryListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ensuredSpaceId = useRequiredSpaceId();
  const { setPageTreeNodes } = usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();
  const { ensureTreeLoaded, loadMoreTree, resetTree } = usePagesStore();
  const activeSpaceId = spaceId || ensuredSpaceId;
  const selectedPageId = useSelectedPageId();
  const pages = useTreePages(activeSpaceId);
  const loading = useTreePagesLoading(activeSpaceId);
  const hasMore = useTreePagesHasMore(activeSpaceId);

  const isSpacesRoute = pathname.startsWith('/spaces/');
  const isTrashRoute = pathname.startsWith('/spaces/trash');
  const skipNextPushRef = useRef(false);
  const routePageId = useMemo(() => {
    if (!routingEnabled || !activeSpaceId) return null;
    const prefix = `/spaces/${encodeURIComponent(activeSpaceId)}/pages/`;
    if (!pathname.startsWith(prefix)) return null;
    const rest = pathname.slice(prefix.length);
    if (!rest) return null;
    const id = rest.split('/')[0];
    if (!id) return null;
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [activeSpaceId, pathname, routingEnabled]);

  const treeParams = useMemo(
    () => ({ query, parentId, onlyRoots, take: pageSize }),
    [onlyRoots, pageSize, parentId, query]
  );

  const nodes = useMemo(
    () => buildPageTreeFromFlatPages(pages),
    [pages]
  );

  const selectFirstNode = useCallback(
    (pages: PageDto[]) => {
      if (!autoSelectFirst) return;

      const currentSelected = usePageSelectionStore.getState().selected;
      if (currentSelected.kind === 'page') {
        const stillExists = pages.some((p) => p.id === currentSelected.id);
        if (stillExists) return;
      }

      const nodes = buildPageTreeFromFlatPages(pages);
      const first = nodes[0];
      if (first?.id) {
        setSelectedPage(first.id, first.data?.title || '');
      }
    },
    [autoSelectFirst, setSelectedPage]
  );

  useEffect(() => {
    if (!activeSpaceId) {
      if (clearOnEmptySpace) setPageTreeNodes([]);
      return;
    }

    let cancelled = false;
    resetTree(activeSpaceId, treeParams);

    (async () => {
      try {
        await ensureTreeLoaded(activeSpaceId, {
          ...treeParams,
          force: true,
        });
      } catch {
        if (cancelled) return;
        setPageTreeNodes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    clearOnEmptySpace,
    ensureTreeLoaded,
    resetTree,
    setPageTreeNodes,
    activeSpaceId,
    treeParams,
  ]);

  useEffect(() => {
    setPageTreeNodes(nodes);
    if (routingEnabled && routePageId) {
      if (selectedPageId !== routePageId) {
        const match = pages.find((page) => page.id === routePageId);
        skipNextPushRef.current = true;
        setSelectedPage(routePageId, match?.title ?? '');
      }
      if (nodes.length) onLoaded?.(pages);
      return;
    }

    if (!nodes.length) return;
    selectFirstNode(pages);
    onLoaded?.(pages);
  }, [
    nodes,
    onLoaded,
    pages,
    routePageId,
    routingEnabled,
    selectFirstNode,
    selectedPageId,
    setPageTreeNodes,
    setSelectedPage,
  ]);

  useEffect(() => {
    if (!autoLoadAll) return;
    if (loading || !hasMore) return;
    void loadMoreTree(activeSpaceId as string);
  }, [activeSpaceId, autoLoadAll, hasMore, loadMoreTree, loading]);

  useEffect(() => {
    if (!routingEnabled) return;
    if (!isSpacesRoute) return;
    if (isTrashRoute) return;
    if (!activeSpaceId || !selectedPageId) return;
    if (!pages.some((page) => page.id === selectedPageId)) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    const target = `/spaces/${encodeURIComponent(activeSpaceId)}/pages/${encodeURIComponent(selectedPageId)}`;
    if (pathname !== target) router.push(target);
  }, [
    activeSpaceId,
    isSpacesRoute,
    isTrashRoute,
    pages,
    pathname,
    router,
    routingEnabled,
    selectedPageId,
  ]);

  return <div />;
}
