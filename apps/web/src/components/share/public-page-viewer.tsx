'use client';

import { SlateEditor, parseContentToSlateValue } from '@/components/shared/slate-editor';
import { EditorTitleDisplay } from '@/components/editor/components/title-display';
import { SharePageHeader } from '@/components/share/share-page-header';
import { ShareDto } from '@/lib/api';
import { ICP_FILING_NUMBER } from '@/lib/filing';
import { CommentSection } from '@/features/comments';

type PublicPageSnapshot = {
  payload?: unknown;
  createdAt?: string;
} | null;

export function PublicPageViewer({
  share,
  snapshot,
  publicId,
  password,
  canWrite,
}: {
  share: ShareDto;
  snapshot: PublicPageSnapshot;
  publicId: string;
  password?: string;
  canWrite: boolean;
}) {
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
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 pb-10 pt-10">
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
          <CommentSection
            mode="public"
            pageId={share.targetId}
            publicId={publicId}
            password={password}
            canWrite={canWrite}
          />
          <div className="mt-auto border-t pt-10 text-center text-sm text-muted-foreground">
            {ICP_FILING_NUMBER}
          </div>
        </div>
      </div>
    </div>
  );
}
