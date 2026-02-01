import { memo, useCallback } from 'react';
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

export const PageEditor = memo(function PageEditor() {
  const pageMode = usePageMode();
  const pageTitle = usePageTitle();
  const editorValue = useEditorValue();
  const selectedPageId = useSelectedPageId();
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
