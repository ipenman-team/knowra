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
  SidebarMenuAction,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { spacesApi } from '@/lib/api';
import type { SpaceDto } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSpaceStore, useSpaces, useSpacesLoading } from '@/stores';
import type { Space } from '@/stores/space-store';
import { SpaceIcon } from '@/components/icon/space.icon';

import { EllipsisIcon, PlusIcon } from 'lucide-react';
import CreateSpaceModal from '../space/create-space-modal';
import EditSpaceModal from '../space/edit-space-modal';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { BotIcon } from '../icon/bot.icon';
import { WorkbenchIcon } from '../icon/workbench.icon';

export const HomeSidebar = memo(function HomeSidebar() {
  const { setSelectedView } = usePageSelectionStore();
  const spaces = useSpaces();
  const loading = useSpacesLoading();
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const [openCreate, setOpenCreate] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({});
  const updateSpaceLocal = useSpaceStore((s) => s.updateSpaceLocal);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);

  const router = useRouter();

  const handleSelectView = useCallback(
    (id: ViewId) => {
      setSelectedView(id);
      const target =
        id === 'workbench'
          ? '/workbench'
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

  const normalizeSpace = useCallback((space: SpaceDto): Space => {
    const metadata =
      space.metadata &&
      typeof space.metadata === 'object' &&
      !Array.isArray(space.metadata)
        ? (space.metadata as Record<string, unknown>)
        : null;

    return {
      id: space.id,
      name: space.name,
      color: space.color ?? null,
      metadata,
    };
  }, []);

  const handleCreated = (created: SpaceDto) => {
    // prepend to store list
    useSpaceStore.setState((prev) => ({
      spaces: [normalizeSpace(created), ...prev.spaces],
    }));
  };

  const toggleFavorite = useCallback(
    async (space: Space) => {
      const nextFavorite = !favoriteIds[space.id];
      setFavoriteIds((prev) => ({
        ...prev,
        [space.id]: nextFavorite,
      }));

      try {
        await spacesApi.setFavorite(space.id, { favorite: nextFavorite });
      } catch (error) {
        setFavoriteIds((prev) => ({
          ...prev,
          [space.id]: !nextFavorite,
        }));
      }
    },
    [favoriteIds],
  );

  const openEditor = useCallback((space: Space) => {
    setEditingSpaceId(space.id);
    setOpenEdit(true);
  }, []);

  const handleUpdated = useCallback(
    (updated: SpaceDto) => {
      const normalized = normalizeSpace(updated);
      updateSpaceLocal(updated.id, {
        name: normalized.name,
        color: normalized.color ?? null,
        metadata: normalized.metadata ?? null,
      });
    },
    [normalizeSpace, updateSpaceLocal],
  );

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

        <SidebarContent className="overflow-hidden">
          <SidebarGroup className="shrink-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem
                  key="workbench"
                  onClick={() => handleSelectView('workbench')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <WorkbenchIcon />
                      <span className="font-bold">工作台</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem
                  key="contexta-ai"
                  onClick={() => handleSelectView('contexta-ai')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <BotIcon fill={true} color="#525252" />
                      <span className="font-bold">ContextA AI</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="flex-1 min-h-0">
            <SidebarGroupLabel>
              <div className="flex justify-between flex-1 items-center">
                空间
                <Button
                  variant="ghost"
                  className="h-6 w-6"
                  size="icon"
                  onClick={() => setOpenCreate(true)}
                >
                  <PlusIcon />
                </Button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 overflow-y-auto">
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
                        <div className="flex items-center gap-2 cursor-pointer text-muted-foreground text-lg">
                          <SpaceIcon color={space.color as string} />
                          <span>{space.name}</span>
                        </div>
                      </SidebarMenuButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            aria-label="更多"
                          >
                            <EllipsisIcon />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onPointerDown={(event) => {
                              event.stopPropagation();
                            }}
                            onSelect={(event) => {
                              event.stopPropagation();
                              openEditor(space);
                            }}
                          >
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onPointerDown={(event) => {
                              event.stopPropagation();
                            }}
                            onSelect={(event) => {
                              event.stopPropagation();
                              void toggleFavorite(space);
                            }}
                          >
                            {favoriteIds[space.id] ? '取消收藏' : '收藏'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

        {openEdit && editingSpaceId ? (
          <EditSpaceModal
            open={openEdit}
            onOpenChange={(next) => {
              setOpenEdit(next);
              if (!next) setEditingSpaceId(null);
            }}
            spaceId={editingSpaceId}
            onUpdated={handleUpdated}
          />
        ) : null}
      </Sidebar>
    </>
  );
});
