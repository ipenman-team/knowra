'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useSpaces,
  useCurrentSpaceId,
  useSpaceStore,
  useSpaceSectionStore,
} from '@/stores';
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  BoltIcon,
  BookMinus,
  ChevronLeft,
  FolderIcon,
  ListTreeIcon,
  RecycleIcon,
  FileTextIcon,
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

export const SpaceSidebar = memo(function SpaceSidebar(props: {}) {
  const router = useRouter();
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);
  const section = useSpaceSectionStore((s) => s.section);

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
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
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

      <SidebarContent className="min-h-0 flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="p-3">
              <div className="flex items-center gap-3">
                <BookMinus size={20} color={current?.color || 'currentColor'} />
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
            <DirectoryList spaceId={current?.id ?? ''} />
            <SidebarMenu>
              {section === 'pages' ? <PageTreeContainer /> : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <div className="flex justify-between text-muted-foreground items-center h-6">
          <Button variant="ghost" size="lg">
            <ListTreeIcon />
          </Button>
          <Separator orientation="vertical" />
          <Button variant="ghost" size="lg">
            <RecycleIcon />
          </Button>
          <Separator orientation="vertical" />
          <Button variant="ghost" size="lg">
            <BoltIcon />
          </Button>
        </div>
      </SidebarFooter>
    </aside>
  );
});
