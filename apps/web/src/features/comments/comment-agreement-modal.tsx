'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Markdown } from '@/components/shared/markdown';
import type { PublicCommentAgreement } from '@/lib/api/public-comments';

export function CommentAgreementModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: PublicCommentAgreement | null;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.agreement?.title ?? '评论协议'}</DialogTitle>
          <DialogDescription>
            版本：{props.agreement?.version ?? 'v1'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Markdown
            content={props.agreement?.contentMarkdown ?? '暂无评论协议内容。'}
            className="text-sm"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
