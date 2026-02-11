'use client';

import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { buildPageVersionsUrl } from '@/lib/navigation';

export function PageHeaderVersionsItem(props: { pageId: string | null }) {
  const router = useRouter();
  const versionsHref = props.pageId
    ? buildPageVersionsUrl(props.pageId)
    : null;

  return (
    <DropdownMenuItem
      disabled={!versionsHref}
      onSelect={(event) => {
        event.preventDefault();
        if (!versionsHref) return;
        router.push(versionsHref);
      }}
    >
      历史版本
    </DropdownMenuItem>
  );
}
