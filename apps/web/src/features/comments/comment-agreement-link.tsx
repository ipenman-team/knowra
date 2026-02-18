'use client';

import { Button } from '@/components/ui/button';

export function CommentAgreementLink(props: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="link"
      className={props.className}
      onClick={props.onClick}
    >
      评论协议
    </Button>
  );
}
