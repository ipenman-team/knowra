import { memo, useCallback, useEffect } from 'react';
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

export const PageEditor = memo(function PageEditor() {
  const pageMode = usePageMode();
  const pageTitle = usePageTitle();
  const editorValue = useEditorValue();
  const selectedPageId = useSelectedPageId();
  const latestPublishedVersionId = usePageContentStore(
    (s) => s.activePage?.latestPublishedVersionId,
  );
  const publishedSnapshot = usePageContentStore((s) => s.publishedSnapshot);
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const setDraftTitle = usePageStore((s) => s.setDraftTitle);
  const { setEditorValue } = usePageContentStore();

  const isPreview = pageMode === 'preview';
  const previewTitle = publishedSnapshot?.title ?? pageTitle;
  const previewValue = publishedSnapshot
    ? parseContentToSlateValue(publishedSnapshot.content)
    : editorValue;

  const pageKeyBase = selectedPageId ?? 'none';
  const previewEditorKey = `${pageKeyBase}-preview-${publishedSnapshot?.updatedAt ?? 'none'}`;
  const editEditorKey = `${pageKeyBase}-edit`;

  const handleTitleChange = useCallback(
    (value: string) => setDraftTitle(value),
    [setDraftTitle]
  );

  const handleEditorChange = useCallback(
    (value: SlateValue) => setEditorValue(value),
    [setEditorValue]
  );

  useEffect(() => {
    if (!isPreview) return;
    if (!selectedPageId) return;
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
    <div className="mx-auto w-full max-w-5xl space-y-4 pt-6">
      <div className="space-y-2">
        {isPreview ? (
          <EditorTitleDisplay title={previewTitle} />
        ) : (
          <EditorTitleInput
            value={pageTitle}
            disabled={pageLoading}
            onChange={handleTitleChange}
          />
        )}
      </div>

      <div className="pt-2">
        <SlateEditor
          key={isPreview ? previewEditorKey : editEditorKey}
          value={previewValue}
          onChange={handleEditorChange}
          disabled={pageLoading}
          readOnly={isPreview}
          showToolbar={!isPreview}
          placeholder={isPreview ? undefined : '直接输入正文…'}
        />
      </div>
    </div>
  );
});
