'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import {
  SlateEditor,
  parseContentToSlateValue,
  type SlateValue,
} from '@/components/shared/slate-editor';
import { EditorTitleInput } from './title-input';
import { EditorTitleDisplay } from './title-display';
import {
  usePageMode,
  usePageTitle,
  useEditorValue,
  usePageContentStore,
  useSelectedPageId,
  usePageStore,
} from '@/stores';
import { pageVersionsApi } from '@/lib/api';
import { saveDraft } from '@/lib/page/save-draft';
import { cn } from '@/lib/utils';
import { CommentSection } from '@/features/comments';

export const PageEditor = memo(function PageEditor() {
  const pageMode = usePageMode();
  const pageTitle = usePageTitle();
  const editorValue = useEditorValue();
  const selectedPageId = useSelectedPageId();
  const activePageId = usePageContentStore((s) => s.activePage?.id ?? null);
  const activeSpaceId = usePageContentStore((s) => s.activePage?.spaceId ?? null);
  const latestPublishedVersionId = usePageContentStore(
    (s) => s.activePage?.latestPublishedVersionId,
  );
  const publishedSnapshot = usePageContentStore((s) => s.publishedSnapshot);
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const setDraftTitle = usePageStore((s) => s.setDraftTitle);
  const { setEditorValue } = usePageContentStore();

  const dirtyRef = useRef(false);
  const emptyPreviewValue = useRef(parseContentToSlateValue('')).current;

  const isPreview = pageMode === 'preview';
  const previewTitle = publishedSnapshot?.title ?? pageTitle;
  const previewValue = publishedSnapshot
    ? parseContentToSlateValue(publishedSnapshot.content)
    : emptyPreviewValue;
  const currentValue = isPreview ? previewValue : editorValue;

  const pageKeyBase = selectedPageId ?? 'none';
  const previewEditorKey = `${pageKeyBase}-preview-${publishedSnapshot?.updatedAt ?? 'none'}`;
  const editEditorKey = `${pageKeyBase}-edit`;

  const handleTitleChange = useCallback(
    (value: string) => {
      dirtyRef.current = true;
      setDraftTitle(value);
    },
    [setDraftTitle],
  );

  const handleEditorChange = useCallback(
    (value: SlateValue) => {
      if (isPreview) return;
      dirtyRef.current = true;
      setEditorValue(value);
    },
    [isPreview, setEditorValue],
  );

  useEffect(() => {
    dirtyRef.current = false;
  }, [activePageId]);

  useEffect(() => {
    if (isPreview) return;
    if (!activePageId) return;

    let disposed = false;

    const timer = window.setInterval(() => {
      if (disposed) return;
      if (!dirtyRef.current) return;

      const state = usePageContentStore.getState();
      const activePage = state.activePage;
      if (!activePage?.id || !activePage.spaceId) return;
      if (state.pageMode !== 'edit') return;
      if (state.pageLoading || state.pageSaving || state.pagePublishing) return;

      const normalizedTitle = state.pageTitle.trim() || '无标题文档';
      const content = state.editorValue;

      dirtyRef.current = false;

      (async () => {
        const contentStore = usePageContentStore.getState();
        try {
          contentStore.setPageSaving(true);
          await saveDraft({
            spaceId: activePage.spaceId,
            pageId: activePage.id,
            title: normalizedTitle,
            content,
          });
        } catch {
          dirtyRef.current = true;
        } finally {
          contentStore.setPageSaving(false);
        }
      })();
    }, 5000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [activePageId, isPreview]);

  useEffect(() => {
    if (!isPreview) return;
    if (!selectedPageId) return;
    if (!activePageId || activePageId !== selectedPageId) return;
    if (!latestPublishedVersionId) return;

    let cancelled = false;
    (async () => {
      try {
        const published = await pageVersionsApi.getVersion(
          selectedPageId,
          latestPublishedVersionId,
        );
        if (cancelled) return;
        usePageContentStore.getState().setPublishedSnapshot({
          title: published.title,
          content: published.content,
          updatedBy: published.updatedBy,
          updatedAt: published.updatedAt,
        });
      } catch {
        // Ignore: page may not be published yet.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPreview, selectedPageId, latestPublishedVersionId]);

  return (
    <div className={cn("mx-auto w-full max-w-5xl", { "pt-6": isPreview })}>
      <SlateEditor
        key={isPreview ? previewEditorKey : editEditorKey}
        value={currentValue}
        onChange={handleEditorChange}
        disabled={pageLoading}
        readOnly={isPreview}
        showToolbar={!isPreview}
        inlineAi={{
          enabled: true,
          allowReadOnly: isPreview,
          pageId: activePageId ?? undefined,
          spaceId: activeSpaceId ?? undefined,
        }}
        placeholder={isPreview ? undefined : '输入 / 唤起工具栏'}
        topContent={
          isPreview ? (
            <EditorTitleDisplay title={previewTitle} />
          ) : (
            <EditorTitleInput
              value={pageTitle}
              disabled={pageLoading}
              onChange={handleTitleChange}
            />
          )
        }
        topContentClassName="space-y-2"
      />
      {activePageId && activeSpaceId ? (
        <CommentSection mode="internal" pageId={activePageId} spaceId={activeSpaceId} />
      ) : null}
    </div>
  );
});
