'use client';

import { useCallback, useMemo, useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { PageDto } from '@/lib/api/pages/types';
import { UploadFileTile } from '@/components/ui/upload-file-tile';
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function collectTextFromSlateLike(input: unknown, buffer: string[]): void {
  if (input == null) return;
  if (typeof input === 'string') {
    const value = input.trim();
    if (value) buffer.push(value);
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((item) => collectTextFromSlateLike(item, buffer));
    return;
  }
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (typeof record.text === 'string') {
      const value = record.text.trim();
      if (value) buffer.push(value);
    }
    if (Array.isArray(record.children)) {
      collectTextFromSlateLike(record.children, buffer);
    }
  }
}

function getPageSummary(content: unknown, maxLength = 170): string {
  const buffer: string[] = [];
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      collectTextFromSlateLike(parsed, buffer);
    } catch {
      collectTextFromSlateLike(content, buffer);
    }
  } else {
    collectTextFromSlateLike(content, buffer);
  }
  const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '暂无摘要';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
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

  return (
    <div
      className={cn(
        style === 'card' ? 'grid gap-4 md:grid-cols-2' : 'divide-y border-y',
      )}
    >
      {pages.map((page) => {
        const isDragging = draggingId === page.id;
        const isDragOver = dragOverId === page.id && draggingId !== page.id;
        const coverUrl = pageCoverMap[page.id] ?? null;
        const summary = getPageSummary(page.content);

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
              style === 'card'
                ? 'rounded-lg border bg-card p-3 text-left transition'
                : 'bg-background py-6 text-left transition hover:bg-accent/20',
              isDragging && 'opacity-60',
              isDragOver && 'border-primary',
            )}
          >
            {style === 'card' ? (
              <>
                <UploadFileTile
                  value={coverUrl}
                  fileName={page.title}
                  alt={`${page.title} cover`}
                  className="mb-3 h-36 w-full rounded-md"
                  emptyLabel="Upload"
                  errorLabel="封面上传失败"
                  maxSizeBytes={MAX_COVER_SIZE_BYTES}
                  onUpload={onUploadCoverFile}
                  onChange={(coverUrl) => onUpdateCover(page.id, coverUrl)}
                />
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
                <div className="mt-2 text-sm font-medium text-primary">Read More &gt;</div>
              </>
            ) : (
              <div className="flex items-start gap-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="line-clamp-2 font-medium leading-tight">
                      {page.title}
                    </div>
                    <span className="inline-flex cursor-grab items-center rounded-md border px-2 py-1 text-xs text-muted-foreground">
                      <GripVertical className="mr-1 h-3.5 w-3.5" />
                      拖拽排序
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatUpdatedAt(page.updatedAt)} · 已发布
                  </div>
                  <div className="line-clamp-4 text-xs leading-7 text-foreground/90">
                    {summary}
                  </div>
                </div>
                <UploadFileTile
                  value={coverUrl}
                  fileName={page.title}
                  alt={`${page.title} cover`}
                  className="h-24 w-24 shrink-0 rounded-sm"
                  emptyLabel="Upload"
                  errorLabel="封面上传失败"
                  maxSizeBytes={MAX_COVER_SIZE_BYTES}
                  onUpload={onUploadCoverFile}
                  onChange={(coverUrl) => onUpdateCover(page.id, coverUrl)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
