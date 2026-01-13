import { create } from 'zustand';
import type { ViewId } from '@/features/home/types';

export type Selected =
  | { kind: 'view'; id: ViewId }
  | { kind: 'page'; id: string; title: string };

interface PageSelectionState {
  selected: Selected;
  setSelected: (selected: Selected) => void;
  setSelectedPage: (id: string, title: string) => void;
  setSelectedView: (id: ViewId) => void;
}

export const usePageSelectionStore = create<PageSelectionState>((set) => ({
  selected: { kind: 'view', id: 'dashboard' },

  setSelected: (selected) => set({ selected }),

  setSelectedPage: (id, title) => set({
    selected: { kind: 'page', id, title }
  }),

  setSelectedView: (id) => set({
    selected: { kind: 'view', id }
  }),
}));

// Selector hooks for fine-grained subscriptions
export const useSelectedPageId = () =>
  usePageSelectionStore((state) =>
    state.selected.kind === 'page' ? state.selected.id : null
  );

export const useSelectedView = () =>
  usePageSelectionStore((state) =>
    state.selected.kind === 'view' ? state.selected.id : null
  );

// 🔑 Critical: Per-node selector prevents full tree re-renders
// Each tree node subscribes only to its own selection state
export const useIsPageSelected = (pageId: string) =>
  usePageSelectionStore((state) =>
    state.selected.kind === 'page' && state.selected.id === pageId
  );
