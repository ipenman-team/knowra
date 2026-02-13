'use client';

import { useMemo, useState } from 'react';
import type { PageDto } from '@/lib/api/pages/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SiteBuilderPageListConfig = {
  style: 'list' | 'card';
  pageIds: string[];
  pageCovers: Record<string, string>;
};

type SiteBuilderPageListConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PageDto[];
  initialConfig: SiteBuilderPageListConfig;
  onSubmit: (nextConfig: SiteBuilderPageListConfig) => void;
};

export function SiteBuilderPageListConfigDialog({
  open,
  onOpenChange,
  pages,
  initialConfig,
  onSubmit,
}: SiteBuilderPageListConfigDialogProps) {
  const [style, setStyle] = useState<'list' | 'card'>(initialConfig.style);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>(
    initialConfig.pageIds,
  );
  const [pageCovers, setPageCovers] = useState<Record<string, string>>(
    initialConfig.pageCovers,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStyle(initialConfig.style);
      setSelectedPageIds(initialConfig.pageIds);
      setPageCovers(initialConfig.pageCovers);
    }
    onOpenChange(nextOpen);
  };

  const selectedSet = useMemo(
    () => new Set(selectedPageIds),
    [selectedPageIds],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>多页面配置</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="space-y-2">
            <Label>列表样式</Label>
            <Select
              value={style}
              onValueChange={(value: 'list' | 'card') => setStyle(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="列表样式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">card</SelectItem>
                <SelectItem value="list">list</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="space-y-2">
          <Label>选择页面</Label>
          <div className="max-h-[42vh] space-y-1 overflow-y-auto rounded-md border p-3">
            {pages.length ? (
              pages.map((page) => {
                const checked = selectedSet.has(page.id);
                return (
                  <label
                    key={page.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition hover:bg-accent',
                      checked && 'bg-accent/50',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        setSelectedPageIds((previous) => {
                          if (nextChecked) {
                            if (previous.includes(page.id)) return previous;
                            return [...previous, page.id];
                          }
                          setPageCovers((prevCovers) => {
                            if (!(page.id in prevCovers)) return prevCovers;
                            const next = { ...prevCovers };
                            delete next[page.id];
                            return next;
                          });
                          return previous.filter((id) => id !== page.id);
                        });
                      }}
                    />
                    <span className="truncate text-base">{page.title}</span>
                  </label>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                当前空间暂无页面可选。
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onSubmit({
                style,
                pageIds: selectedPageIds,
                pageCovers: Object.fromEntries(
                  selectedPageIds
                    .map((pageId) => [pageId, pageCovers[pageId]] as const)
                    .filter(
                      (entry): entry is [string, string] =>
                        typeof entry[1] === 'string' && Boolean(entry[1].trim()),
                    ),
                ),
              });
            }}
          >
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
