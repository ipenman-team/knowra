import { useCallback, useEffect } from 'react';
import { pagesApi, type PageDto } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import {
  usePageTreeStore,
  usePageContentStore,
  usePageSelectionStore,
  useUIStateStore,
  useCreatingPage,
} from '@/stores';
import type { TreeNode } from '@/components/shared/tree';

export async function commitRenameFromState(args: {
  setSelectedPage: (id: string, title: string) => void;
}) {
  const { renamingTarget, renamingValue, setSavingRename, cancelRename } =
    useUIStateStore.getState();
  if (!renamingTarget) return;

  const nextTitle = renamingValue.trim() || '无标题文档';

  try {
    setSavingRename(true);
    const page = await pagesApi.rename(renamingTarget.id, {
      title: nextTitle,
    });

    usePageTreeStore.getState().updateNode(page.id, {
      label: page.title,
      data: page,
    });

    const { selected } = usePageSelectionStore.getState();
    if (selected.kind === 'page' && selected.id === page.id) {
      args.setSelectedPage(page.id, page.title);

      const {
        activePage,
        setActivePage,
        setPageTitle,
        publishedSnapshot,
        setPublishedSnapshot,
      } = usePageContentStore.getState();

      if (activePage?.id === page.id) {
        setActivePage(page);
        setPageTitle(page.title);

        if (publishedSnapshot) {
          setPublishedSnapshot({ ...publishedSnapshot, title: page.title });
        }
      }
    }
    cancelRename();
  } finally {
    setSavingRename(false);
  }
}

/**
 * 页面树 CRUD 操作 Hook
 * 提供：创建、删除、重命名、刷新等业务逻辑
 *
 * 从 tree-container.tsx 提取的业务逻辑
 */
export function usePageTreeCRUD() {
  const creatingPage = useCreatingPage();
  const pagesLoaded = usePageTreeStore((s) => s.pagesLoaded);
  const { setPageTreeNodes, setPagesLoaded, setCreatingPage } = usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();

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
  const commitRename = useCallback(
    async () =>
      commitRenameFromState({
        setSelectedPage,
      }),
    [setSelectedPage]
  );

  // 初始加载页面树
  useEffect(() => {
    if (pagesLoaded) return;
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
  }, [pagesLoaded, setPageTreeNodes, setPagesLoaded]);

  return {
    refreshPages,
    createPage,
    createChildPage,
    commitRename,
    creatingPage,
  };
}
