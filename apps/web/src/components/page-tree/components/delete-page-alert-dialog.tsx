'use client';

import { useCallback, useMemo } from 'react';
import { buildPageTreeFromFlatPages } from '@knowra/shared';

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
import { pagesApi } from '@/lib/api';
import { useRequiredSpaceId } from '@/hooks/use-required-space';
import {
  usePageSelectionStore,
  usePagesStore,
  useUIStateStore,
  usePageStore,
} from '@/stores';

function resolveSpaceIdForDeleteTarget(pageId: string, preferredSpaceId: string | null): string | null {
  if (preferredSpaceId) return preferredSpaceId;

  // Fallback: search cached tree pages.
  const store = usePagesStore.getState();
  for (const pages of Object.values(store.treePagesBySpaceId)) {
    const found = pages.find((p) => p.id === pageId);
    if (found?.spaceId) return found.spaceId;
  }

  // Fallback: search non-tree cache.
  const fromFlat = store.getPageById(pageId);
  return fromFlat?.spaceId ?? null;
}

export function DeletePageAlertDialog() {
  const deleteTarget = useUIStateStore((s) => s.deleteTarget);
  const deletingPage = useUIStateStore((s) => s.deletingPage);
  const { setDeleteTarget, setDeletingPage } = useUIStateStore();

  const preferredSpaceId = useRequiredSpaceId();

  const spaceId = deleteTarget
    ? resolveSpaceIdForDeleteTarget(deleteTarget.id, preferredSpaceId)
    : null;

  const description = useMemo(() => {
    if (!deleteTarget) return '';
    return `执行此操作，子页面会一并删除，确认删除“${deleteTarget.title}”？删除后，可在回收站中恢复。`;
  }, [deleteTarget]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      if (deletingPage) return;
      setDeleteTarget(null);
    },
    [deletingPage, setDeleteTarget],
  );

  const handleConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (!spaceId) return;

    const beforePagesStore = usePagesStore.getState();
    const removedIds = new Set([deleteTarget.id]);

    try {
      setDeletingPage(true);
      await pagesApi.remove(spaceId, deleteTarget.id);

      // Update cached tree list -> DirectoryList will rebuild nodes & update PageTreeStore.
      beforePagesStore.removeTreeSubtree(spaceId, deleteTarget.id);

      const selection = usePageSelectionStore.getState();
      const selected = selection.selected;
      const activePageId = usePageStore.getState().pageId;

      const shouldSwitch =
        (selected.kind === 'page' && removedIds.has(selected.id)) ||
        (activePageId != null && removedIds.has(activePageId));

      if (shouldSwitch) {
        const remaining = usePagesStore.getState().treePagesBySpaceId[spaceId] ?? [];
        const nodes = buildPageTreeFromFlatPages(remaining);
        const first = nodes[0];
        if (first?.id) {
          selection.setSelectedPage(first.id, first.data?.title || '');
        } else {
          selection.setSelectedView('workbench');
        }
      }

      setDeleteTarget(null);
    } finally {
      setDeletingPage(false);
    }
  }, [deleteTarget, setDeleteTarget, setDeletingPage, spaceId]);

  return (
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingPage}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={deletingPage || !deleteTarget || !spaceId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {deletingPage ? '删除中…' : '确认'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
