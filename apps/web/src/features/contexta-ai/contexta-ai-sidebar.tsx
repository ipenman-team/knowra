'use client';

import { memo, useMemo, useState } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  EllipsisIcon,
  Pin,
} from 'lucide-react';

import type { ContextaAiConversation } from '@/features/contexta-ai/types';
import { Separator } from '@/components/ui/separator';
import { SidebarContainer } from '@/components/sidebar/sidebar-container';

export const ContextaAiSidebar = memo(function ContextaAiSidebar(props: {
  conversations: ContextaAiConversation[];
  activeId: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onTogglePinConversation: (id: string) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return props.conversations;
    return props.conversations.filter((c) =>
      (c.title || '').toLowerCase().includes(q),
    );
  }, [keyword, props.conversations]);

  const items = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [filtered]);

  function beginRename(id: string, title: string) {
    setRenamingId(id);
    setRenameValue(title || '');
  }

  function commitRename(id: string) {
    const next = renameValue.trim();
    props.onRenameConversation(id, next);
    setRenamingId(null);
    setRenameValue('');
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  return (
    <SidebarContainer position="relative" className="h-full">
      <SidebarHeader className="p-4">
        <InputGroup>
          <InputGroupInput
            placeholder="搜索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel>历史对话</SidebarGroupLabel>
          <SidebarMenu>
            {items.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                暂无对话
              </div>
            ) : (
              items.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    isActive={c.id === props.activeId}
                    onClick={() => props.onSelectConversation(c.id)}
                  >
                    {c.pinned ? (
                      <Pin className="text-muted-foreground" />
                    ) : null}
                    {renamingId === c.id ? (
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitRename(c.id);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                        onBlur={() => commitRename(c.id)}
                        className="h-7 flex-1"
                      />
                    ) : (
                      <span>{c.title || '未命名对话'}</span>
                    )}
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        aria-label="更多"
                      >
                        <EllipsisIcon />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          beginRename(c.id, c.title);
                        }}
                      >
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          props.onTogglePinConversation(c.id);
                        }}
                      >
                        {c.pinned ? '取消置顶' : '置顶'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Separator></Separator>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={props.onNewConversation}
              className="border-2 border-blue-400 hover:bg-blue-100 bg-blue-50 flex justify-center"
            >
              <Plus />
              <span>新对话</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarContainer>
  );
});
