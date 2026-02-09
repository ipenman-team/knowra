'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EllipsisIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PageHeaderMoreMenu(props: { pageId: string | null }) {
  const router = useRouter();

  const versionsHref = useMemo(() => {
    if (!props.pageId) return null;
    return `/pages/${encodeURIComponent(props.pageId)}/versions`;
  }, [props.pageId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" disabled={!versionsHref} aria-label="更多">
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={!versionsHref}
          onSelect={(e) => {
            e.preventDefault();
            if (!versionsHref) return;
            router.push(versionsHref);
          }}
        >
          历史版本
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
