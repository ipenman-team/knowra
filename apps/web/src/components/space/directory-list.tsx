"use client";

import { useCallback, useEffect, useMemo } from 'react';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import {
  usePageSelectionStore,
  usePageTreeStore,
  usePagesStore,
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
  onLoaded,
}: DirectoryListProps) {
  const ensuredSpaceId = useRequiredSpaceId();
  const { setPageTreeNodes } = usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();
  const { ensureTreeLoaded, loadMoreTree, resetTree } = usePagesStore();
  const activeSpaceId = spaceId || ensuredSpaceId;
  const pages = useTreePages(activeSpaceId);
  const loading = useTreePagesLoading(activeSpaceId);
  const hasMore = useTreePagesHasMore(activeSpaceId);

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
    resetTree(activeSpaceId, {
      query,
      parentId,
      onlyRoots,
      take: pageSize,
    });

    (async () => {
      try {
        await ensureTreeLoaded(activeSpaceId, {
          query,
          parentId,
          onlyRoots,
          take: pageSize,
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
    onlyRoots,
    onLoaded,
    pageSize,
    parentId,
    query,
    resetTree,
    selectFirstNode,
    setPageTreeNodes,
    activeSpaceId,
  ]);

  useEffect(() => {
    setPageTreeNodes(nodes);
    if (!nodes.length) return;
    selectFirstNode(pages);
    onLoaded?.(pages);
  }, [nodes, onLoaded, pages, selectFirstNode, setPageTreeNodes]);

  useEffect(() => {
    if (!autoLoadAll) return;
    if (loading || !hasMore) return;
    void loadMoreTree(activeSpaceId as string);
  }, [activeSpaceId, autoLoadAll, hasMore, loadMoreTree, loading]);

  return <div />;
}
