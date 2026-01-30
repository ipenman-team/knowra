'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSpaces, useCurrentSpaceId, useSpaceStore } from '@/stores';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarProvider,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { BookMinus, ChevronLeft } from 'lucide-react';
import { PageTreeContainer } from '@/components/page-tree/components/tree-container';
import { CreatePageMenu } from '../page-tree/components/create-page-menu';

export const SpaceSidebar = memo(function SpaceSidebar({
  onOpenImport,
}: {
  onOpenImport?: () => void;
}) {
  const router = useRouter();
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  const current = spaces.find((s) => s.id === currentId) ?? spaces[0];

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSelectSpace = useCallback(
    (id?: string) => {
      if (!id) return;
      setCurrent(id);
      router.push(`/spaces/${encodeURIComponent(id)}`);
    },
    [router, setCurrent],
  );

  return (
    <SidebarProvider>
      <Sidebar className="h-full">
        <SidebarHeader>
          <div className="flex items-center justify-between p-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ChevronLeft />
              <span>返回首页</span>
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <BookMinus
                    size={20}
                    color={current?.color || 'currentColor'}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {current?.name ?? '空间'}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <select
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={current?.id ?? ''}
                    onChange={(e) => handleSelectSpace(e.target.value)}
                  >
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex justify-between flex-1">
                页面
                <CreatePageMenu />
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <PageTreeContainer onOpenImport={onOpenImport ?? (() => {})} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
});
