'use client';

import { EditorTitleDisplay } from '@/components/editor/components/title-display';
import {
  SlateEditor,
  parseContentToSlateValue,
} from '@/components/shared/slate-editor';
import type { SiteTemplatePage } from '../../template.types';

type KnowledgePageMenuBaseProps = {
  pageId: string | null;
  pageMap: Record<string, SiteTemplatePage>;
  emptyText: string;
  missingText?: string;
};

export function KnowledgePageMenuBase({
  pageId,
  pageMap,
  emptyText,
  missingText = '页面内容不存在或未发布。',
}: KnowledgePageMenuBaseProps) {
  if (!pageId) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  const page = pageMap[pageId];
  if (!page) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        {missingText}
      </div>
    );
  }

  const slateValue = parseContentToSlateValue(page.content);
  return (
    <section className="space-y-4 rounded-md bg-card p-5">
      <SlateEditor
        className="border-none"
        key={`${page.id}-${page.updatedAt}`}
        value={slateValue}
        readOnly
        showToolbar={false}
        onChange={() => {}}
      />
    </section>
  );
}
