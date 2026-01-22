import { memo, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarItem } from '@/features/home/components/sidebar-item';
import { PageTreeContainer } from '../page-tree';
import { usePageSelectionStore } from '@/stores';
import type { ViewId } from '@/features/home/types';
import { UserProfilePanel } from '../profile';

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
      <div className="flex h-dvh flex-col overflow-hidden p-3">
        <div className="flex justify-between p-3">
          <div></div>
          <div>
            <UserProfilePanel />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <SidebarItem
            label="仪表盘"
            active={selected.kind === 'view' && selected.id === 'dashboard'}
            onClick={() => handleSelectView('dashboard')}
          />

          <SidebarItem
            label="ContextA AI"
            active={selected.kind === 'view' && selected.id === 'contexta-ai'}
            onClick={() => handleSelectView('contexta-ai')}
          />

          <Separator />
        </div>

        <div className="flex-1 min-h-0 overflow-auto py-4">
          <PageTreeContainer onOpenImport={onOpenImport} />
        </div>

        <Separator />

        <div className="pt-4">
          <SidebarItem
            label="设置"
            active={selected.kind === 'view' && selected.id === 'settings'}
            onClick={() => handleSelectView('settings')}
          />
        </div>
      </div>
    </aside>
  );
});
