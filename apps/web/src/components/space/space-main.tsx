"use client";

import { useSelectedPageId, usePageSelectionStore } from '@/stores';

export default function SpaceMain() {
  const selectedPageId = useSelectedPageId();
  const selected = usePageSelectionStore((s) => s.selected);

  if (!selectedPageId || selected.kind !== 'page') {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        请选择或创建一个页面
      </div>
    );
  }

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="text-lg font-semibold">
          {selected.title || '无标题文档'}
        </div>
        <div className="h-6 w-40 rounded bg-muted/40" aria-hidden="true" />
      </div>
      <div className="flex-1 px-6 py-8">
        <div className="h-full rounded-lg border border-dashed bg-muted/20" />
      </div>
    </div>
  );
}
