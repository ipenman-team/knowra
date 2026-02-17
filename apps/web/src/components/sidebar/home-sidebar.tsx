'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import type { ViewId } from '@/features/home/types';
import { AccountMenu } from '../account-menu';
import { useNavigation } from '@/lib/navigation';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { spacesApi } from '@/lib/api';
import type { SpaceDto } from '@/lib/api';
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
import { Empty } from '../empty';
import { MarkIcon } from '../icon/mark';
import { useI18n } from '@/lib/i18n/provider';

export const HomeSidebar = memo(function HomeSidebar() {
  const { t } = useI18n();
  const { navigateToView, navigateToSpace } = useNavigation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const spaces = useSpaces();
  const loading = useSpacesLoading();
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const [openCreate, setOpenCreate] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({});
  const updateSpaceLocal = useSpaceStore((s) => s.updateSpaceLocal);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);

  const isCollapsed = state === 'collapsed';

  const iconSize = isCollapsed ? '1.25rem' : '1rem';

  const closeMobileSidebar = useCallback(() => {
    if (!isMobile) return;
    setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const handleSelectView = useCallback(
    (id: ViewId) => {
      navigateToView(id);
      closeMobileSidebar();
    },
    [closeMobileSidebar, navigateToView],
  );

  const handleSelectSpace = useCallback(
    (spaceId: string) => {
      navigateToSpace(spaceId);
      closeMobileSidebar();
    },
    [closeMobileSidebar, navigateToSpace],
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
      } catch {
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
          <div
            className={`flex p-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            {!isCollapsed && <div>{/* flex 占位 */}</div>}
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
                  <SidebarMenuButton asChild tooltip={t('homeSidebar.workbench')}>
                    <div
                      className={`flex w-full min-w-0 items-center gap-2 cursor-pointer text-muted-foreground ${isCollapsed && 'justify-center'}`}
                    >
                      <WorkbenchIcon size={iconSize} />
                      {!isCollapsed && (
                        <span className="min-w-0 flex-1 truncate">
                          {t('homeSidebar.workbench')}
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem
                  key="contexta-ai"
                  onClick={() => handleSelectView('contexta-ai')}
                >
                  <SidebarMenuButton asChild tooltip="ContextA AI">
                    <div
                      className={`flex w-full min-w-0 items-center gap-2 cursor-pointer text-muted-foreground ${isCollapsed && 'justify-center'}`}
                    >
                      <BotIcon fill color="#525252" size={iconSize} />
                      {!isCollapsed && (
                        <span className="min-w-0 flex-1 truncate">
                          ContextA AI
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem
                  key="favorites"
                  onClick={() => handleSelectView('favorites')}
                >
                  <SidebarMenuButton asChild tooltip={t('homeSidebar.myFavorites')}>
                    <div
                      className={`flex w-full min-w-0 items-center gap-2 cursor-pointer text-muted-foreground ${isCollapsed && 'justify-center'}`}
                    >
                      <MarkIcon size={iconSize} />
                      {!isCollapsed && (
                        <span className="min-w-0 flex-1 truncate">
                          {t('homeSidebar.myFavorites')}
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="flex-1 min-h-0">
            {!isCollapsed && (
              <SidebarGroupLabel>
                <div className="flex justify-between flex-1 items-center">
                  {t('homeSidebar.spaces')}
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
            )}
            <SidebarGroupContent className="min-h-0 overflow-y-auto overflow-x-hidden">
              <SidebarMenu>
                {isCollapsed && (
                  <SidebarMenuItem onClick={() => setOpenCreate(true)}>
                    <SidebarMenuButton asChild tooltip={t('homeSidebar.createSpace')}>
                      <div className="flex items-center gap-2 cursor-pointer text-muted-foreground justify-center">
                        <PlusIcon />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {loading ? (
                  <div className="px-2 text-sm text-muted-foreground">
                    {t('homeSidebar.loadingSpaces')}
                  </div>
                ) : spaces.length === 0 ? (
                  <SidebarMenuItem>
                    <Empty />
                  </SidebarMenuItem>
                ) : (
                  spaces.map((space) => (
                    <SidebarMenuItem
                      key={space.id}
                      onClick={() => {
                        handleSelectSpace(space.id);
                      }}
                    >
                      <SidebarMenuButton asChild tooltip={space.name}>
                        <div
                          className={`flex w-full min-w-0 items-center gap-2 cursor-pointer text-muted-foreground text-lg ${isCollapsed && 'justify-center'}`}
                        >
                          <SpaceIcon
                            color={space.color as string}
                            size={iconSize}
                          />
                          {!isCollapsed && (
                            <span className="min-w-0 flex-1 truncate">
                              {space.name}
                            </span>
                          )}
                        </div>
                      </SidebarMenuButton>

                      {!isCollapsed && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction
                              showOnHover
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              aria-label={t('common.more')}
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
                              {t('common.edit')}
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
                              {favoriteIds[space.id]
                                ? t('common.unfavorite')
                                : t('common.favorite')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
