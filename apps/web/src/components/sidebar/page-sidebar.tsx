import { memo, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarItem } from '@/features/home/components/sidebar-item';
import { PageTreeContainer } from '../page-tree';
import { usePageSelectionStore } from '@/stores';
import type { ViewId } from '@/features/home/types';

export const PageSidebar = memo(function PageSidebar({
  onOpenImport,
}: {
  onOpenImport: () => void;
}) {
  const selected = usePageSelectionStore((s) => s.selected);
  const { setSelectedView } = usePageSelectionStore();

  const handleSelectView = useCallback(
    (id: ViewId) => setSelectedView(id),
    [setSelectedView]
  );

  return (
    <aside className="w-72 border-r bg-muted/30">
      <div className="flex h-dvh flex-col gap-4 overflow-auto p-3">
        <SidebarItem
          label="仪表盘"
          active={selected.kind === 'view' && selected.id === 'dashboard'}
          onClick={() => handleSelectView('dashboard')}
        />

        <SidebarItem
          label="Notion AI"
          active={selected.kind === 'view' && selected.id === 'notion-ai'}
          onClick={() => handleSelectView('notion-ai')}
        />

        <Separator />

        <PageTreeContainer onOpenImport={onOpenImport} />

        <SidebarItem
          label="设置"
          active={selected.kind === 'view' && selected.id === 'settings'}
          onClick={() => handleSelectView('settings')}
        />
      </div>
    </aside>
  );
});
