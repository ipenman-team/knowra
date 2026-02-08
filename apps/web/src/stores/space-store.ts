import { create } from 'zustand';
import { spacesApi } from '@/lib/api';

export type Space = {
  id: string;
  name: string;
  color?: string | null;
  metadata?: Record<string, unknown> | null;
};

interface SpaceState {
  spaces: Space[];
  loaded: boolean;
  loading: boolean;
  currentSpaceId: string | null;
  ensureLoaded: (options?: { force?: boolean }) => Promise<void>;
  setSpaces: (spaces: Space[]) => void;
  updateSpaceLocal: (id: string, patch: Partial<Omit<Space, 'id'>>) => void;
  setCurrentSpaceId: (id: string | null) => void;
  invalidate: () => void;
}

let inflight: Promise<void> | null = null;

export const useSpaceStore = create<SpaceState>((set, get) => ({
  spaces: [],
  loaded: false,
  loading: false,
  currentSpaceId: null,

  invalidate: () => set({ loaded: false }),

  setSpaces: (spaces) => set({ spaces }),

  updateSpaceLocal: (id, patch) =>
    set((state) => ({
      spaces: state.spaces.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  setCurrentSpaceId: (id) => set({ currentSpaceId: id }),

  ensureLoaded: async (options) => {
    const force = Boolean(options?.force);
    const state = get();
    if (!force && state.loaded) return;
    if (!force && inflight) return inflight;

    inflight = (async () => {
      set({ loading: true });
      try {
        const res = await spacesApi.list({ skip: 0, take: 200 });
        const items = res?.items || [];
        set({ spaces: items as Space[], loaded: true });
        // If no currentSpaceId, set the first one
        const cur = get().currentSpaceId;
        if (!cur && items.length > 0) set({ currentSpaceId: items[0].id });
      } finally {
        inflight = null;
        set({ loading: false });
      }
    })();

    return inflight;
  },
}));

export const useSpaces = () => useSpaceStore((s) => s.spaces);
export const useSpacesLoaded = () => useSpaceStore((s) => s.loaded);
export const useSpacesLoading = () => useSpaceStore((s) => s.loading);
export const useCurrentSpaceId = () => useSpaceStore((s) => s.currentSpaceId);
