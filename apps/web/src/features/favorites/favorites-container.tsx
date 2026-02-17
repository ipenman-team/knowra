'use client';

import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { ContainerLayout } from '@/components/layout/container-layout';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { usePageSelectionStore } from '@/stores';
import { FavoritesSidebar } from './components/favorites-sidebar';
import { FavoritesTable } from './components/favorites-table';
import { useFavoritesData } from './hooks/use-favorites-data';

function getSearchPlaceholder(section: 'SPACE' | 'PAGE'): string {
  return section === 'SPACE' ? '搜索空间名或标识' : '搜索页面名或所属空间';
}

export function FavoritesContainer() {
  const {
    section,
    setSection,
    query,
    setQuery,
    state,
    spaceItems,
    pageItems,
  } = useFavoritesData();

  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  useEffect(() => {
    setSelectedView('favorites');
  }, [setSelectedView]);

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
            <div>
              <h1 className="text-lg font-semibold">我的收藏</h1>
              <p className="text-sm text-muted-foreground">
                {section === 'SPACE' ? '空间收藏列表' : '页面收藏列表'}
              </p>
            </div>

            <div className="w-full md:w-[320px]">
              <InputGroup>
                <InputGroupInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={getSearchPlaceholder(section)}
                />
                <InputGroupAddon align="inline-end">
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <FavoritesTable
            section={section}
            state={state}
            spaceItems={spaceItems}
            pageItems={pageItems}
          />
        </div>
      </ContainerLayout>
    </div>
  );
}
