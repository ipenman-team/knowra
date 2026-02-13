'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { PageDto } from '@/lib/api/pages/types';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SiteBuilderPageListPreviewProps = {
  pages: PageDto[];
  style: 'list' | 'card';
  pageCoverMap: Record<string, string>;
  onReorder: (pageIds: string[]) => void;
  onUpdateCover: (pageId: string, coverUrl: string | null) => void;
  onUploadCoverFile: (file: File) => Promise<string | null>;
};

const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;

function formatUpdatedAt(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (!Number.isFinite(date.getTime())) return '--';
  return date.toLocaleString();
}

export function SiteBuilderPageListPreview({
  pages,
  style,
  pageCoverMap,
  onReorder,
  onUpdateCover,
  onUploadCoverFile,
}: SiteBuilderPageListPreviewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [uploadTargetPageId, setUploadTargetPageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pageIds = useMemo(() => pages.map((page) => page.id), [pages]);

  const movePage = useCallback(
    (fromId: string, toId: string) => {
      if (!fromId || !toId || fromId === toId) return;
      const fromIndex = pageIds.indexOf(fromId);
      const toIndex = pageIds.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0) return;

      const nextPageIds = [...pageIds];
      const [moved] = nextPageIds.splice(fromIndex, 1);
      nextPageIds.splice(toIndex, 0, moved);
      onReorder(nextPageIds);
    },
    [onReorder, pageIds],
  );

  const handleSelectCover = (pageId: string) => {
    setUploadTargetPageId(pageId);
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const targetPageId = uploadTargetPageId;
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!targetPageId || !file) return;
          if (!file.type.startsWith('image/')) {
            toast.error('请选择图片文件');
            return;
          }
          if (file.size > MAX_COVER_SIZE_BYTES) {
            toast.error('封面文件不能超过 2MB');
            return;
          }
          void onUploadCoverFile(file).then((coverUrl) => {
            if (!coverUrl) return;
            onUpdateCover(targetPageId, coverUrl);
          });
        }}
      />
      <div
        className={cn(
          'gap-4',
          style === 'card' ? 'grid md:grid-cols-2' : 'flex flex-col',
        )}
      >
      {pages.map((page) => {
        const isDragging = draggingId === page.id;
        const isDragOver = dragOverId === page.id && draggingId !== page.id;
        const coverUrl = pageCoverMap[page.id] ?? null;

        return (
          <div
            key={page.id}
            draggable
            onDragStart={(event) => {
              setDraggingId(page.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOverId(page.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingId) movePage(draggingId, page.id);
              setDraggingId(null);
              setDragOverId(null);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={cn(
              'rounded-lg border bg-card p-3 text-left transition',
              isDragging && 'opacity-60',
              isDragOver && 'border-primary',
            )}
          >
            {coverUrl ? (
              <div className="mb-3 overflow-hidden rounded-md border bg-muted/20">
                <Image
                  src={coverUrl}
                  alt={`${page.title} cover`}
                  width={1200}
                  height={630}
                  unoptimized
                  className="h-36 w-full object-cover"
                />
              </div>
            ) : null}
            <div className="mb-1 flex items-center justify-between">
              <div className="line-clamp-2 text-lg font-semibold">{page.title}</div>
              <span className="inline-flex cursor-grab items-center rounded-md border px-2 py-1 text-xs text-muted-foreground">
                <GripVertical className="mr-1 h-3.5 w-3.5" />
                拖拽排序
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              发布于 {formatUpdatedAt(page.updatedAt)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectCover(page.id)}
              >
                {coverUrl ? '替换封面' : '上传封面'}
              </Button>
              {coverUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateCover(page.id, null)}
                >
                  清除封面
                </Button>
              ) : null}
            </div>
            <div className="mt-2 text-sm font-medium text-primary">Read More &gt;</div>
          </div>
        );
      })}
      </div>
    </>
  );
}
