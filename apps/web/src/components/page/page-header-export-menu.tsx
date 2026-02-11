'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { MarkdownIcon } from '@/components/icon/markdown';
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { exportPageAsMarkdown } from '@/lib/page/export-page';

export function PageHeaderExportMenu(props: {
  pageId: string | null;
  spaceId: string | null;
  title?: string | null;
}) {
  const [exporting, setExporting] = useState(false);
  const canExport = Boolean(props.pageId && props.spaceId);
  const isDisabled = !canExport || exporting;

  const handleMarkdownExport = (event: Event) => {
    event.preventDefault();
    if (!props.pageId || !props.spaceId || exporting) return;

    setExporting(true);
    void (async () => {
      try {
        await exportPageAsMarkdown({
          pageId: props.pageId as string,
          spaceId: props.spaceId as string,
          title: props.title ?? undefined,
        });
        toast.success('已导出 Markdown');
      } finally {
        setExporting(false);
      }
    })();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={isDisabled}>导出</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            disabled={isDisabled}
            onSelect={handleMarkdownExport}
          >
            <MarkdownIcon />
            Markdown
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
