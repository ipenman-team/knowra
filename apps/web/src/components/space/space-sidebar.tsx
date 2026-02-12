'use client';

import { memo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  useSpaces,
  useCurrentSpaceId,
} from '@/stores';
import {
  useNavigation,
  useSpaceRoute,
  buildSpaceUrl,
  buildTrashUrl,
} from '@/lib/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  Sidebar,
} from '@/components/ui/sidebar';
import {
  BoltIcon,
  ListTreeIcon,
  RecycleIcon,
} from 'lucide-react';
import { PageTreeContainer } from '@/components/page-tree/components/tree-container';
import { CreatePageMenu } from '../page-tree/components/create-page-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import DirectoryList from './directory-list';
import { SpaceIcon } from '../icon/space.icon';
import { SettingsSidebarContent } from './settings-sidebar-content';

export const SpaceSidebar = memo(function SpaceSidebar() {
  const { navigateToSpace } = useNavigation();
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const pathname = usePathname();

  const routeSpaceId = useSpaceRoute();

  const activeSpaceId = routeSpaceId ?? currentId;
  const isTrash = pathname.startsWith('/spaces/trash');
  
  const isSettings = pathname.includes('/page-share') ||
                     pathname.includes('/space-share') ||
                     pathname.includes('/site-builder') ||
                     pathname.includes('/settings')

  const section = isTrash ? 'trash' : isSettings ? 'settings' : 'pages';

  const current =
    spaces.find((s) => s.id === activeSpaceId) ??
    spaces.find((s) => s.id === currentId) ??
    spaces[0];

  const handleSelectSpace = useCallback(
    (id?: string) => {
      if (!id) return;
      // 使用 Navigation Service 直接跳转
      // store 会通过 RouteSync 自动同步
      navigateToSpace(id);
    },
    [navigateToSpace],
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
      {section === 'settings' ? (
        <SettingsSidebarContent spaceId={activeSpaceId ?? ''} pathname={pathname} />
      ) : (
        <SidebarContent className="min-h-0 flex-1 overflow-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <SpaceIcon size={20} color={current?.color as string} />
                  <div className="flex-1">
                    <Select
                      value={current?.id ?? ''}
                      onValueChange={handleSelectSpace}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="选择空间" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces.map((s) => (
                          <SelectItem key={s.id} value={s.id} className='truncate'>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
              <DirectoryList spaceId={activeSpaceId ?? ''} />
              <SidebarMenu>
                <PageTreeContainer />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}

      <SidebarFooter>
        <Separator />
        <div className="flex justify-between text-muted-foreground items-center h-6">
          <Link href={buildSpaceUrl(activeSpaceId ?? currentId ?? '')}>
            <Button
              variant={section === 'pages' ? 'secondary' : 'ghost'}
              size="lg"
            >
              <ListTreeIcon />
            </Button>
          </Link>
          <Separator orientation="vertical" />
          <Link href={buildTrashUrl()}>
            <Button
              variant={section === 'trash' ? 'secondary' : 'ghost'}
              size="lg"
            >
              <RecycleIcon />
            </Button>
          </Link>
          <Separator orientation="vertical" />
          <Link href={`/spaces/${activeSpaceId ?? currentId ?? ''}/page-share`}>
            <Button 
                variant={section === 'settings' ? 'secondary' : 'ghost'}
                size="lg"
            >
              <BoltIcon />
            </Button>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
});
