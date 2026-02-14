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

function formatDateOnly(input?: string | Date | null): string {
  if (!input) return '';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '';
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

function getPageSummary(content: unknown, maxLength = 180): string {
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
            <div className="line-clamp-2 text-lg font-semibold">
              {item.title}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              发布于 {formatDateTime(item.updatedAt)}
            </div>
            <div className="mt-5 text-sm font-medium text-primary">
              Read More &gt;
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((item) => {
        const page = pageMap[item.id];
        const summary = getPageSummary(page?.content);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPageId(item.id)}
            className={cn(
              'w-full px-0 py-8 text-left transition-colors hover:bg-accent/30',
            )}
          >
            <div className="flex items-start gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <h3 className="line-clamp-2 text-basic font-medium leading-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateOnly(item.updatedAt)} · 已发布
                </p>
                <p className="line-clamp-4 text-xs leading-7 text-foreground/90">
                  {summary}
                </p>
              </div>
              {item.coverUrl && (
                <div className="hidden h-32 w-48 shrink-0 overflow-hidden rounded-sm bg-muted/20 md:block">
                  <Image
                    src={item.coverUrl}
                    alt={`${item.title} cover`}
                    width={384}
                    height={256}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
