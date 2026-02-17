'use client';

import { memo, useCallback, useMemo, useState } from 'react';

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
  useSidebar,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, EllipsisIcon, Pin } from 'lucide-react';

import type { ContextaAiConversation } from '@/features/contexta-ai/types';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

export const ContextaAiSidebar = memo(function ContextaAiSidebar(props: {
  conversations: ContextaAiConversation[];
  activeId: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();
  const { onSelectConversation, onNewConversation } = props;
  const [keyword, setKeyword] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] =
    useState<ContextaAiConversation | null>(null);
  const [deletePending, setDeletePending] = useState(false);

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

  const closeMobileSidebar = useCallback(() => {
    if (!isMobile) return;
    setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id);
      closeMobileSidebar();
    },
    [closeMobileSidebar, onSelectConversation],
  );

  const handleNewConversation = useCallback(() => {
    onNewConversation();
    closeMobileSidebar();
  }, [closeMobileSidebar, onNewConversation]);

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

  function handleOpenDelete(target: ContextaAiConversation) {
    setDeleteTarget(target);
  }

  function handleDeleteOpenChange(open: boolean) {
    if (open) return;
    if (deletePending) return;
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await props.onDeleteConversation(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Keep dialog open; errors are handled by global API client.
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
      <SidebarHeader className="p-4">
        <InputGroup>
          <InputGroupInput
            placeholder={t('contextaAiSidebar.searchPlaceholder')}
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
          <SidebarGroupLabel>{t('contextaAiSidebar.history')}</SidebarGroupLabel>
          <SidebarMenu>
            {items.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                {t('contextaAiSidebar.empty')}
              </div>
            ) : (
              items.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    isActive={c.id === props.activeId}
                    onClick={() => handleSelectConversation(c.id)}
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
                      <span>
                        {c.title || t('contextaAiSidebar.untitledConversation')}
                      </span>
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
                        aria-label={t('common.more')}
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
                        {t('contextaAiSidebar.rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          props.onTogglePinConversation(c.id);
                        }}
                      >
                        {c.pinned
                          ? t('contextaAiSidebar.unpin')
                          : t('contextaAiSidebar.pin')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          handleOpenDelete(c);
                        }}
                      >
                        {t('common.delete')}
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
              onClick={handleNewConversation}
              variant="outline"
              className="justify-center font-medium"
            >
              <Plus />
              <span>{t('contextaAiSidebar.newConversation')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={handleDeleteOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contextaAiSidebar.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${t('contextaAiSidebar.deletePrompt')}“${
                    deleteTarget.title || t('contextaAiSidebar.untitledConversation')
                  }”${t('contextaAiSidebar.deletePromptSuffix')}`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteTarget || deletePending}
              className={buttonVariants({ variant: 'destructive' })}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deletePending ? t('common.deleting') : t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
});
