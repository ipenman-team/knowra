'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { ContainerLayout } from '@/components/layout/container-layout';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { usePageSelectionStore } from '@/stores';
import { FavoritesSidebar } from './components/favorites-sidebar';
import { FavoritesTable } from './components/favorites-table';
import { useFavoritesData } from './hooks/use-favorites-data';

export function FavoritesContainer() {
  const {
    section,
    setSection,
    query,
    setQuery,
    state,
    spaceItems,
    pageItems,
    cancelFavorites,
  } = useFavoritesData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  useEffect(() => {
    setSelectedView('favorites');
  }, [setSelectedView]);

  useEffect(() => {
    setSelectedIds([]);
  }, [section]);

  const currentIds = useMemo(
    () =>
      section === 'SPACE'
        ? spaceItems.map((item) => item.favoriteId)
        : pageItems.map((item) => item.favoriteId),
    [pageItems, section, spaceItems],
  );

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => currentIds.includes(id)));
  }, [currentIds]);

  const selectedCount = useMemo(
    () => currentIds.filter((id) => selectedIds.includes(id)).length,
    [currentIds, selectedIds],
  );

  async function handleCancel(ids: string[]) {
    if (ids.length === 0 || state.canceling) return;

    const result = await cancelFavorites(ids);
    if (result.removedIds.length > 0) {
      setSelectedIds((prev) =>
        prev.filter((id) => !result.removedIds.includes(id)),
      );
    }

    if (result.removedIds.length > 0 && result.failedCount === 0) {
      toast.success(
        result.removedIds.length === 1
          ? '已取消收藏'
          : `已取消 ${result.removedIds.length} 条收藏`,
      );
      return;
    }

    if (result.removedIds.length > 0 && result.failedCount > 0) {
      toast.warning(
        `成功 ${result.removedIds.length} 条，失败 ${result.failedCount} 条`,
      );
      return;
    }

    toast.error('取消收藏失败，请稍后重试');
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...currentIds])]);
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
  }

  function handleSelectOne(favoriteId: string, checked: boolean) {
    if (checked) {
      setSelectedIds((prev) =>
        prev.includes(favoriteId) ? prev : [...prev, favoriteId],
      );
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => id !== favoriteId));
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <ContainerLayout
        stateId="favorites"
        defaultWidthRem={14}
        className="h-full min-h-0 overflow-hidden bg-transparent"
        insetClassName="min-h-0 overflow-hidden"
        sidebar={<FavoritesSidebar section={section} onSectionChange={setSection} />}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 lg:px-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-[320px]">
              <InputGroup>
                <InputGroupInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索"
                />
                <InputGroupAddon align="inline-end">
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                disabled={selectedCount === 0 || state.canceling}
                onClick={() => {
                  void handleCancel(
                    currentIds.filter((id) => selectedIds.includes(id)),
                  );
                }}
              >
                {state.canceling
                  ? '处理中…'
                  : selectedCount > 0
                    ? `取消收藏 (${selectedCount})`
                    : '取消收藏'}
              </Button>
            </div>
          </div>

          <FavoritesTable
            section={section}
            state={state}
            spaceItems={spaceItems}
            pageItems={pageItems}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onCancelOne={async (favoriteId) => {
              await handleCancel([favoriteId]);
            }}
          />
        </div>
      </ContainerLayout>
    </div>
  );
}
