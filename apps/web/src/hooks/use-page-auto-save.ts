import { useEffect, useRef, useMemo } from 'react';
import { pagesApi } from '@/lib/api';
import {
  usePageContentStore,
  usePageSelectionStore,
  usePageTreeStore,
} from '@/stores';
import { serializeSlateValue } from '@/components/shared/slate-editor';

/**
 * Automatically saves page changes after 2 seconds of inactivity
 * Handles title and content changes in edit mode
 */
export function usePageAutoSave() {
  const { activePage, pageMode, pageTitle, editorValue } =
    usePageContentStore();
  const { setPageSaving, setLastSavedAt, setActivePage } = usePageContentStore();
  const { selected, setSelected } = usePageSelectionStore();
  const { updateNode } = usePageTreeStore();

  const lastSavedRef = useRef<{
    id: string;
    title: string;
    contentKey: string;
  } | null>(null);

  const editorContentKey = useMemo(
    () => serializeSlateValue(editorValue),
    [editorValue]
  );

  useEffect(() => {
    if (pageMode !== 'edit' || !activePage) return;

    const currentId = activePage.id;
    const nextTitle = pageTitle.trim() || '无标题文档';
    const nextContentKey = editorContentKey;
    const lastSaved = lastSavedRef.current;

    // Skip if unchanged
    if (
      lastSaved?.id === currentId &&
      lastSaved.title === nextTitle &&
      lastSaved.contentKey === nextContentKey
    ) {
      return;
    }

    // Debounce 2 seconds
    const handle = window.setTimeout(async () => {
      try {
        setPageSaving(true);
        const saved = await pagesApi.save(currentId, {
          title: nextTitle,
          content: editorValue,
        });

        const formatTime = (value: string | Date) => {
          const date = typeof value === 'string' ? new Date(value) : value;
          if (Number.isNaN(date.getTime())) return '';
          return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        };

        setLastSavedAt(formatTime(saved.updatedAt));

        const savedValue = serializeSlateValue(editorValue);
        lastSavedRef.current = {
          id: saved.id,
          title: saved.title,
          contentKey: savedValue,
        };

        setActivePage(saved);

        // Update selection if title changed
        if (
          selected.kind === 'page' &&
          selected.id === saved.id &&
          selected.title !== saved.title
        ) {
          setSelected({ kind: 'page', id: saved.id, title: saved.title });
          updateNode(saved.id, { label: saved.title, data: saved });
        }
      } finally {
        setPageSaving(false);
      }
    }, 2000);

    return () => window.clearTimeout(handle);
  }, [
    activePage,
    pageMode,
    pageTitle,
    editorContentKey,
    editorValue,
    selected,
    setActivePage,
    setLastSavedAt,
    setPageSaving,
    setSelected,
    updateNode,
  ]);
}
