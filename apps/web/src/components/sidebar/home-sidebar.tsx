'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { usePageSelectionStore } from '@/stores';
import type { ViewId } from '@/features/home/types';
import { AccountMenu } from '../account-menu';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import type { SpaceDto } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSpaceStore, useSpaces, useSpacesLoading } from '@/stores';

import {
  BookMinus,
  BotIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
} from 'lucide-react';
import CreateSpaceModal from '../space/create-space-modal';

export const HomeSidebar = memo(function HomeSidebar() {
  const { setSelectedView } = usePageSelectionStore();
  const spaces = useSpaces();
  const loading = useSpacesLoading();
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const [openCreate, setOpenCreate] = useState(false);

  const router = useRouter();

  const handleSelectView = useCallback(
    (id: ViewId) => {
      setSelectedView(id);
      const target =
        id === 'dashboard'
          ? '/'
          : id === 'settings'
            ? '/settings'
            : '/contexta-ai';
      router.push(target);
    },
    [router, setSelectedView],
  );

  useEffect(() => {
    void ensureSpacesLoaded();
  }, [ensureSpacesLoaded]);

  const handleCreated = (created: SpaceDto) => {
    // prepend to store list
    useSpaceStore.setState((prev) => ({ spaces: [created, ...prev.spaces] }));
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" className="h-full">
        <SidebarHeader>
          <div className="flex justify-between p-3">
            <div>{/* flex 占位 */}</div>
            <div>
              <AccountMenu />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem
                  key="dashboard"
                  onClick={() => handleSelectView('dashboard')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <LayoutDashboardIcon />
                      <span className="font-bold">仪表盘</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem
                  key="contexta-ai"
                  onClick={() => handleSelectView('contexta-ai')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <BotIcon />
                      <span className="font-bold">ContextA AI</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex justify-between flex-1">
                空间
                <PlusCircleIcon
                  className="w-4 h-4 cursor-pointer text-muted-foreground"
                  onClick={() => setOpenCreate(true)}
                />
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <div className="px-2 text-sm text-muted-foreground">
                    加载中…
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="px-2 text-sm text-muted-foreground">
                    暂无空间
                  </div>
                ) : (
                  spaces.map((space) => (
                    <SidebarMenuItem
                      key={space.id}
                      onClick={() => {
                        useSpaceStore.setState({ currentSpaceId: space.id });
                        router.push(`/spaces/${encodeURIComponent(space.id)}`);
                      }}
                    >
                      <SidebarMenuButton asChild>
                        <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                          <BookMinus
                            size={20}
                            strokeWidth={2}
                            color={space.color || 'currentColor'}
                          />
                          <span>{space.name}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {openCreate && (
          <CreateSpaceModal
            open={openCreate}
            onOpenChange={setOpenCreate}
            onCreated={handleCreated}
          />
        )}
      </Sidebar>
    </>
  );
});
