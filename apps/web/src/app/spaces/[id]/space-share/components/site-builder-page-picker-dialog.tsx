'use client';

import type { PageDto } from '@/lib/api/pages/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SiteBuilderPagePickerDialogProps = {
  open: boolean;
  pages: PageDto[];
  onOpenChange: (open: boolean) => void;
  onSelectPage: (pageId: string) => void;
};

export function SiteBuilderPagePickerDialog({
  open,
  pages,
  onOpenChange,
  onSelectPage,
}: SiteBuilderPagePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle>选择绑定页面</DialogTitle>
          <DialogDescription>
            从当前空间页面中选择一个页面绑定到当前菜单。
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-auto">
          {pages.length ? (
            pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelectPage(page.id)}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left hover:bg-accent"
              >
                <span className="truncate text-sm">{page.title}</span>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              当前空间暂无可绑定页面。
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
