import { create } from 'zustand';

export type SidebarUiSnapshot = {
  open: boolean;
  widthRem: number;
};

const DEFAULT_WIDTH_REM = 16;

function normalizeWidthRem(widthRem: number): number {
  if (!Number.isFinite(widthRem) || widthRem <= 0) return DEFAULT_WIDTH_REM;
  return widthRem;
}

interface SidebarUiState {
  byId: Record<string, SidebarUiSnapshot | undefined>;

  ensure: (id: string, initial: SidebarUiSnapshot) => void;
  setOpen: (id: string, open: boolean) => void;
  setWidthRem: (id: string, widthRem: number) => void;
  reset: (id: string) => void;
  resetAll: () => void;
}

export const useSidebarUiStore = create<SidebarUiState>((set, get) => ({
  byId: {},

  ensure: (id, initial) => {
    if (!id) return;
    const current = get().byId[id];
    if (current) return;
    set((s) => ({
      byId: {
        ...s.byId,
        [id]: {
          open: initial.open,
          widthRem: normalizeWidthRem(initial.widthRem),
        },
      },
    }));
  },

  setOpen: (id, open) => {
    if (!id) return;
    set((s) => {
      const prev = s.byId[id] ?? { open: true, widthRem: DEFAULT_WIDTH_REM };
      return {
        byId: {
          ...s.byId,
          [id]: { ...prev, open },
        },
      };
    });
  },

  setWidthRem: (id, widthRem) => {
    if (!id) return;
    const nextWidth = normalizeWidthRem(widthRem);
    set((s) => {
      const prev = s.byId[id] ?? { open: true, widthRem: DEFAULT_WIDTH_REM };
      return {
        byId: {
          ...s.byId,
          [id]: { ...prev, widthRem: nextWidth },
        },
      };
    });
  },

  reset: (id) => {
    if (!id) return;
    set((s) => {
      if (!(id in s.byId)) return s;
      const { [id]: _removed, ...rest } = s.byId;
      return { byId: rest };
    });
  },

  resetAll: () => set({ byId: {} }),
}));

export const useSidebarUiSnapshot = (id: string | undefined) =>
  useSidebarUiStore((s) => (id ? s.byId[id] : undefined));
