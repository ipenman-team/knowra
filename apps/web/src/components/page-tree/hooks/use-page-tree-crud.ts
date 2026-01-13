import { useCallback, useEffect } from 'react';
import { pagesApi, type PageDto } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import {
  usePageTreeStore,
  usePageSelectionStore,
  useUIStateStore,
  useCreatingPage,
} from '@/stores';
import type { TreeNode } from '@/components/shared/tree';

/**
 * 页面树 CRUD 操作 Hook
 * 提供：创建、删除、重命名、刷新等业务逻辑
 *
 * 从 tree-container.tsx 提取的业务逻辑
 */
export function usePageTreeCRUD() {
  const creatingPage = useCreatingPage();
  const { setPageTreeNodes, setPagesLoaded, setCreatingPage } =
    usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();
  const { setSavingRename, cancelRename } = useUIStateStore();
  const renamingTarget = useUIStateStore((s) => s.renamingTarget);
  const renamingValue = useUIStateStore((s) => s.renamingValue);

  // 刷新页面树
  const refreshPages = useCallback(async () => {
    try {
      const pages = await pagesApi.list();
      setPageTreeNodes(buildPageTreeFromFlatPages(pages));
    } finally {
      setPagesLoaded(true);
    }
  }, [setPageTreeNodes, setPagesLoaded]);

  // 创建根页面
  const createPage = useCallback(async () => {
    if (creatingPage) return;
    try {
      setCreatingPage(true);
      const page = await pagesApi.create({ title: '无标题文档' });
      setSelectedPage(page.id, page.title);
      await refreshPages();
    } finally {
      setCreatingPage(false);
    }
  }, [creatingPage, setCreatingPage, setSelectedPage, refreshPages]);

  // 创建子页面
  const createChildPage = useCallback(
    async (parent: TreeNode<PageDto>) => {
      if (creatingPage) return;
      const parentIds = [...(parent.data?.parentIds ?? []), parent.id];
      try {
        setCreatingPage(true);
        const page = await pagesApi.create({
          title: '无标题文档',
          parentIds,
        });
        setSelectedPage(page.id, page.title);
        await refreshPages();
      } finally {
        setCreatingPage(false);
      }
    },
    [creatingPage, setCreatingPage, setSelectedPage, refreshPages]
  );

  // 提交重命名
  const commitRename = useCallback(async () => {
    if (!renamingTarget) return;

    const nextTitle = renamingValue.trim() || '无标题文档';

    try {
      setSavingRename(true);
      const page = await pagesApi.save(renamingTarget.id, {
        title: nextTitle,
      });

      // 如果正在重命名当前选中的页面，更新选择状态
      const { selected } = usePageSelectionStore.getState();
      if (selected.kind === 'page' && selected.id === page.id) {
        setSelectedPage(page.id, page.title);
      }

      await refreshPages();
      cancelRename();
    } finally {
      setSavingRename(false);
    }
  }, [
    renamingTarget,
    renamingValue,
    setSavingRename,
    setSelectedPage,
    refreshPages,
    cancelRename,
  ]);

  // 初始加载页面树
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pages = await pagesApi.list();
        if (cancelled) return;
        setPageTreeNodes(buildPageTreeFromFlatPages(pages));
      } catch {
        if (cancelled) return;
        setPageTreeNodes([]);
      } finally {
        if (cancelled) return;
        setPagesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPageTreeNodes, setPagesLoaded]);

  return {
    refreshPages,
    createPage,
    createChildPage,
    commitRename,
    creatingPage,
  };
}
