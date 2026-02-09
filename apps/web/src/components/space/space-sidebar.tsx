'use client';

import { memo, useCallback, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  useSpaces,
  useCurrentSpaceId,
  useSpaceStore,
} from '@/stores';
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
  BookTextIcon,
  ChevronLeft,
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

export const SpaceSidebar = memo(function SpaceSidebar() {
  const router = useRouter();
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);
  const pathname = usePathname();

  const routeSpaceId = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] !== 'spaces') return null;
    const segment = segments[1];
    if (!segment || segment === 'trash') return null;
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }, [pathname]);

  useEffect(() => {
    if (routeSpaceId && routeSpaceId !== currentId) {
      setCurrent(routeSpaceId);
    }
  }, [currentId, routeSpaceId, setCurrent]);

  const activeSpaceId = routeSpaceId ?? currentId;
  const isTrash = pathname.startsWith('/spaces/trash');
  const section = isTrash ? 'trash' : 'pages';

  const current =
    spaces.find((s) => s.id === activeSpaceId) ??
    spaces.find((s) => s.id === currentId) ??
    spaces[0];

  const handleSelectSpace = useCallback(
    (id?: string) => {
      if (!id) return;
      setCurrent(id);
      router.push(`/spaces/${encodeURIComponent(id)}`);
    },
    [router, setCurrent],
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
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
                        <SelectItem key={s.id} value={s.id}>
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
      <SidebarFooter>
        <Separator />
        <div className="flex justify-between text-muted-foreground items-center h-6">
          <Link href={`/spaces/${encodeURIComponent(activeSpaceId ?? currentId ?? '')}`}>
            <Button
              variant={section === 'pages' ? 'secondary' : 'ghost'}
              size="lg"
            >
              <ListTreeIcon />
            </Button>
          </Link>
          <Separator orientation="vertical" />
          <Link href={`/spaces/trash`}>
            <Button
              variant={section === 'trash' ? 'secondary' : 'ghost'}
              size="lg"
            >
              <RecycleIcon />
            </Button>
          </Link>
          <Separator orientation="vertical" />
          <Button variant="ghost" size="lg">
            <BoltIcon />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
});
