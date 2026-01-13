import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

interface UIStateState {
  // Menu states
  openMenuNodeId: string | null;
  openPageMore: boolean;
  openImportModal: boolean;

  // Rename state
  renamingTarget: { id: string; title: string } | null;
  renamingValue: string;
  savingRename: boolean;

  // Delete state
  deleteTarget: { id: string; title: string } | null;
  deletingPage: boolean;

  // Actions
  setOpenMenuNodeId: (id: string | null) => void;
  setOpenPageMore: (open: boolean) => void;
  setOpenImportModal: (open: boolean) => void;
  setRenamingTarget: (target: { id: string; title: string } | null) => void;
  setRenamingValue: (value: string) => void;
  setSavingRename: (saving: boolean) => void;
  setDeleteTarget: (target: { id: string; title: string } | null) => void;
  setDeletingPage: (deleting: boolean) => void;

  // Convenience actions
  startRename: (id: string, title: string) => void;
  cancelRename: () => void;
}

export const useUIStateStore = create<UIStateState>((set) => ({
  openMenuNodeId: null,
  openPageMore: false,
  openImportModal: false,
  renamingTarget: null,
  renamingValue: '',
  savingRename: false,
  deleteTarget: null,
  deletingPage: false,

  setOpenMenuNodeId: (openMenuNodeId) => set({ openMenuNodeId }),
  setOpenPageMore: (openPageMore) => set({ openPageMore }),
  setOpenImportModal: (openImportModal) => set({ openImportModal }),
  setRenamingTarget: (renamingTarget) => set({ renamingTarget }),
  setRenamingValue: (renamingValue) => set({ renamingValue }),
  setSavingRename: (savingRename) => set({ savingRename }),
  setDeleteTarget: (deleteTarget) => set({ deleteTarget }),
  setDeletingPage: (deletingPage) => set({ deletingPage }),

  startRename: (id, title) =>
    set({
      renamingTarget: { id, title },
      renamingValue: title,
    }),

  cancelRename: () =>
    set({
      renamingTarget: null,
      renamingValue: '',
    }),
}));

// Per-node selector hooks to prevent full tree re-renders
// Split into separate selectors to avoid returning new objects
export const useIsNodeRenaming = (nodeId: string) =>
  useUIStateStore((s) => s.renamingTarget?.id === nodeId);

export const useRenamingValue = () =>
  useUIStateStore((s) => s.renamingValue);

export const useSavingRename = () =>
  useUIStateStore((s) => s.savingRename);

export const useNodeMenuState = (nodeId: string) =>
  useUIStateStore((s) => s.openMenuNodeId === nodeId);
