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
} from '@/stores';

export const PageEditor = memo(function PageEditor() {
  const pageMode = usePageMode();
  const pageTitle = usePageTitle();
  const editorValue = useEditorValue();
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const publishedSnapshot = usePageContentStore((s) => s.publishedSnapshot);
  const { setPageTitle, setEditorValue } = usePageContentStore();

  const isPreview = pageMode === 'preview';
  const previewTitle = publishedSnapshot?.title ?? pageTitle;
  const previewValue = isPreview
    ? publishedSnapshot
      ? parseContentToSlateValue(publishedSnapshot.content)
      : editorValue
    : editorValue;

  const handleTitleChange = useCallback(
    (value: string) => setPageTitle(value),
    [setPageTitle]
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
