'use client';

import { SlateEditor, parseContentToSlateValue } from '@/components/shared/slate-editor';
import { EditorTitleDisplay } from '@/components/editor/components/title-display';
import { SharePageHeader } from '@/components/share/share-page-header';
import { ShareDto } from '@/lib/api';

export function PublicPageViewer({ share, snapshot }: { share: ShareDto; snapshot: any }) {
  const content = snapshot?.payload?.content;
  const title = snapshot?.payload?.title;
  const publishedAt = snapshot?.createdAt;
  const slateValue = parseContentToSlateValue(content);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SharePageHeader title={title} publishedAt={publishedAt} />
      <div className="mx-auto w-full max-w-5xl space-y-4 pt-10 px-6 pb-20 flex-1">
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
          Powered by Contexta
        </div>
      </div>
    </div>
  )
}
