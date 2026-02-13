'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type {
  SiteTemplateBlogItem,
  SiteTemplatePage,
} from '../../template.types';
import { KnowledgePageMenuBase } from './page-menu-base';

type KnowledgeBlogMenuProps = {
  style: 'list' | 'card';
  items: SiteTemplateBlogItem[];
  pageMap: Record<string, SiteTemplatePage>;
  selectedPageId: string | null;
  onSelectPageId: (pageId: string | null) => void;
};

function formatDateTime(input?: string | Date | null): string {
  if (!input) return '';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString();
}

export function KnowledgeBlogMenu({
  style,
  items,
  pageMap,
  selectedPageId,
  onSelectPageId,
}: KnowledgeBlogMenuProps) {
  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Blog 暂无可展示内容。
      </div>
    );
  }

  if (selectedPageId) {
    const selectedInList =
      items.find((item) => item.id === selectedPageId) ?? null;
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectPageId(null)}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            返回文章列表
          </button>
          <span className="text-xs text-muted-foreground">
            发布于 {formatDateTime(selectedInList?.updatedAt)}
          </span>
        </div>
        <KnowledgePageMenuBase
          pageId={selectedPageId}
          pageMap={pageMap}
          emptyText="请选择文章。"
          missingText="页面内容不存在或正在加载。"
        />
      </section>
    );
  }

  if (style === 'card') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPageId(item.id)}
            className={cn(
              'rounded-md border bg-card p-4 text-left transition-colors hover:bg-accent',
            )}
          >
            {item.coverUrl ? (
              <div className="mb-3 overflow-hidden rounded-md border bg-muted/20">
                <Image
                  src={item.coverUrl}
                  alt={`${item.title} cover`}
                  width={1200}
                  height={630}
                  unoptimized
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : null}
            <div className="line-clamp-2 text-lg font-semibold">{item.title}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              发布于 {formatDateTime(item.updatedAt)}
            </div>
            <div className="mt-5 text-sm font-medium text-primary">Read More &gt;</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectPageId(item.id)}
          className={cn('w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent')}
        >
          <div className="flex items-start gap-3">
            {item.coverUrl ? (
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                <Image
                  src={item.coverUrl}
                  alt={`${item.title} cover`}
                  width={320}
                  height={200}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 font-medium">{item.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                发布于 {formatDateTime(item.updatedAt)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm font-medium text-primary">Read More &gt;</div>
        </button>
      ))}
    </div>
  );
}
