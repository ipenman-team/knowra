'use client';

import { SlateEditor, parseContentToSlateValue } from '@/components/shared/slate-editor';
import { EditorTitleDisplay } from '@/components/editor/components/title-display';
import { SharePageHeader } from '@/components/share/share-page-header';
import { ShareDto } from '@/lib/api';
import { ICP_FILING_NUMBER } from '@/lib/filing';

type PublicPageSnapshot = {
  payload?: unknown;
  createdAt?: string;
} | null;

export function PublicPageViewer({ snapshot }: { share: ShareDto; snapshot: PublicPageSnapshot }) {
  const payload =
    snapshot?.payload && typeof snapshot.payload === 'object'
      ? (snapshot.payload as Record<string, unknown>)
      : {};
  const content = payload.content;
  const title =
    typeof payload.title === 'string' && payload.title.trim()
      ? payload.title
      : '无标题文档';
  const publishedAt = snapshot?.createdAt;
  const slateValue = parseContentToSlateValue(content);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SharePageHeader title={title} publishedAt={publishedAt} />
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto space-y-4 px-6 pb-20 pt-10">
        <div className="space-y-2">
          <EditorTitleDisplay title={title} />
        </div>
        <div className="pt-2">
           <SlateEditor 
             value={slateValue} 
             readOnly={true} 
             showToolbar={false}
             onChange={() => {}} 
           />
        </div>
        <div className="text-center text-sm text-muted-foreground pt-10 border-t mt-10">
          {ICP_FILING_NUMBER}
        </div>
      </div>
    </div>
  )
}
