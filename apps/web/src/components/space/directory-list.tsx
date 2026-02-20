"use client";

import { useCallback, useEffect, useMemo } from 'react';
import { buildPageTreeFromFlatPages } from '@knowra/shared';
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
import { usePageRoute } from '@/lib/navigation/route-parsers';

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
  const ensuredSpaceId = useRequiredSpaceId();
  const { setPageTreeNodes } = usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();
  const { ensureTreeLoaded, loadMoreTree, resetTree } = usePagesStore();
  const activeSpaceId = spaceId || ensuredSpaceId;
  const selectedPageId = useSelectedPageId();
  const pages = useTreePages(activeSpaceId);
  const loading = useTreePagesLoading(activeSpaceId);
  const hasMore = useTreePagesHasMore(activeSpaceId);

  // 使用新的 route parser 从 URL 解析当前页面 ID
  const routePageId = usePageRoute();

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

    // 如果 URL 中有页面 ID，同步到 store（更新 title）
    // NOTE: pageId 本身已经由 RouteSync 同步，这里只是更新 title
    if (routingEnabled && routePageId) {
      if (selectedPageId !== routePageId) {
        const match = pages.find((page) => page.id === routePageId);
        setSelectedPage(routePageId, match?.title ?? '');
      }
      if (nodes.length) onLoaded?.(pages);
      return;
    }

    // 如果没有选中页面，自动选中第一个
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

  // NOTE: URL 同步逻辑已移除
  // 路由跳转现在通过 Navigation Service 在用户操作时直接触发
  // 参见: tree-item.tsx 的 handleSelect 函数

  return <div />;
}
