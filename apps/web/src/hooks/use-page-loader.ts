import { useEffect } from 'react';
import { pagesApi } from '@/lib/api';
import { usePageContentStore, usePageSelectionStore, usePageTreeStore } from '@/stores';
import { parseContentToSlateValue } from '@/components/shared/slate-editor';
import type { TreeNode } from '@/components/shared/tree';
import type { PageDto } from '@/lib/api';

/**
 * Loads page data when a page is selected
 * Also loads the published snapshot for preview mode
 */
export function usePageLoader(
  pageId: string | null,
  options?: {
    enabled?: boolean;
    mode?: 'edit' | 'preview';
    loadPublishedSnapshot?: boolean;
  }
) {
  const {
    setActivePage,
    setPageMode,
    setPageTitle,
    setEditorValue,
    setLastSavedAt,
    setPublishedSnapshot,
    setPageLoading,
    resetPageContent,
  } = usePageContentStore();

  useEffect(() => {
    if (options?.enabled === false) return;
    if (!pageId) {
      resetPageContent();
      return;
    }

    let cancelled = false;
    setPageLoading(true);

    (async () => {
      try {
        const page = await pagesApi.get(pageId);
        if (cancelled) return;

        setActivePage(page);
        setPageMode(options?.mode ?? 'preview');
        setPublishedSnapshot(null);
        setPageTitle(page.title);

        const formatTime = (value: string | Date) => {
          const date = typeof value === 'string' ? new Date(value) : value;
          if (Number.isNaN(date.getTime())) return '';
          return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        };

        setLastSavedAt(formatTime(page.updatedAt));

        const loadedValue = parseContentToSlateValue(page.content);
        setEditorValue(loadedValue);

        if (options?.loadPublishedSnapshot ?? false) {
          try {
            const published = await pagesApi.getLatestPublished(page.id);
            if (cancelled) return;
            setPublishedSnapshot({
              title: published.title,
              content: published.content,
              updatedBy: published.updatedBy,
              updatedAt: published.updatedAt,
            });
          } catch {
            // No published version
          }
        }
      } finally {
        if (cancelled) return;
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pageId,
    options?.enabled,
    options?.loadPublishedSnapshot,
    options?.mode,
    resetPageContent,
    setActivePage,
    setEditorValue,
    setLastSavedAt,
    setPageLoading,
    setPageMode,
    setPageTitle,
    setPublishedSnapshot,
  ]);
}

function findTitleInTree(nodes: TreeNode<PageDto>[], pageId: string): string | null {
  for (const node of nodes) {
    if (node.id === pageId) return node.data?.title?.trim() || null;
    const children = node.children;
    if (children?.length) {
      const found = findTitleInTree(children, pageId);
      if (found) return found;
    }
  }
  return null;
}

export function usePublishedPageLoader(
  pageId: string | null,
  options?: { enabled?: boolean }
) {
  const {
    setActivePage,
    setPageMode,
    setPageTitle,
    setEditorValue,
    setLastSavedAt,
    setPublishedSnapshot,
    setPageLoading,
    resetPageContent,
  } = usePageContentStore();

  useEffect(() => {
    if (options?.enabled === false) return;
    if (!pageId) {
      resetPageContent();
      return;
    }

    let cancelled = false;
    setPageLoading(true);

    (async () => {
      try {
        setActivePage(null);
        setPageMode('preview');
        setLastSavedAt(null);
        setPublishedSnapshot(null);

        try {
          const published = await pagesApi.getLatestPublished(pageId);
          if (cancelled) return;

          setPageTitle(published.title);
          setEditorValue(parseContentToSlateValue(published.content));
          setPublishedSnapshot({
            title: published.title,
            content: published.content,
            updatedBy: published.updatedBy,
            updatedAt: published.updatedAt,
          });
        } catch {
          const selected = usePageSelectionStore.getState().selected;
          const selectedTitle =
            selected.kind === 'page' && selected.id === pageId ? selected.title : '';
          const pageTreeNodes = usePageTreeStore.getState().pageTreeNodes;
          const fallbackTitle =
            selectedTitle.trim() || findTitleInTree(pageTreeNodes, pageId) || '未发布';
          setPageTitle(fallbackTitle);
          setEditorValue(parseContentToSlateValue(''));
          setPublishedSnapshot(null);
        }
      } finally {
        if (cancelled) return;
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pageId,
    options?.enabled,
    resetPageContent,
    setActivePage,
    setEditorValue,
    setLastSavedAt,
    setPageLoading,
    setPageMode,
    setPageTitle,
    setPublishedSnapshot,
  ]);
}
