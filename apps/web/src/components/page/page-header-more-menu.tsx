'use client';

import { EllipsisIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeaderExportMenu } from './page-header-export-menu';
import { PageHeaderVersionsItem } from './page-header-versions-item';

export function PageHeaderMoreMenu(props: {
  pageId: string | null;
  spaceId: string | null;
  title?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" disabled={!props.pageId} aria-label="更多">
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <PageHeaderVersionsItem pageId={props.pageId} />
        <DropdownMenuSeparator />
        <PageHeaderExportMenu
          pageId={props.pageId}
          spaceId={props.spaceId}
          title={props.title}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
