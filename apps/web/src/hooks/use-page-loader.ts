import { useEffect } from 'react';
import { pagesApi } from '@/lib/api';
import { usePageContentStore } from '@/stores';
import { parseContentToSlateValue } from '@/components/shared/slate-editor';

/**
 * Loads page data when a page is selected
 * Also loads the published snapshot for preview mode
 */
export function usePageLoader(pageId: string | null) {
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
        setPageMode('preview');
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

        // Load published snapshot
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
      } finally {
        if (cancelled) return;
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageId]);
}
