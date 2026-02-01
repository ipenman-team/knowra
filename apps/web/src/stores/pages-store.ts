import { create } from 'zustand';
import type { PageDto } from '@/lib/api';

import { pagesApi } from '@/lib/api';

interface PagesState {
  pagesBySpaceId: Record<string, PageDto[]>;
  loadedBySpaceId: Record<string, boolean>;
  loadingBySpaceId: Record<string, boolean>;

  ensureLoaded: (spaceId: string, options?: { force?: boolean }) => Promise<void>;
  setPages: (spaceId: string, pages: PageDto[]) => void;
  upsertPage: (spaceId: string, page: PageDto) => void;
  removePage: (spaceId: string, pageId: string) => void;
  invalidate: (spaceId?: string) => void;
  getPageById: (pageId: string) => PageDto | undefined;

  treePagesBySpaceId: Record<string, PageDto[]>;
  treeLoadedBySpaceId: Record<string, boolean>;
  treeLoadingBySpaceId: Record<string, boolean>;
  treeHasMoreBySpaceId: Record<string, boolean>;
  treeCursorBySpaceId: Record<string, string | null>;
  treeFilterBySpaceId: Record<string, TreeFilter>;

  ensureTreeLoaded: (
    spaceId: string,
    options?: { force?: boolean } & Partial<TreeFilter>
  ) => Promise<void>;
  loadMoreTree: (spaceId: string) => Promise<void>;
  resetTree: (spaceId: string, filter?: Partial<TreeFilter>) => void;
  upsertTreePage: (spaceId: string, page: PageDto) => void;
  removeTreeSubtree: (spaceId: string, pageId: string) => string[];
}

const inflight = new Map<string, Promise<void>>();
const treeInflight = new Map<string, Promise<void>>();

type TreeFilter = {
  query: string;
  parentId: string | null;
  onlyRoots: boolean;
  take: number;
};

const DEFAULT_TREE_TAKE = 200;

const normalizeTreeFilter = (input?: Partial<TreeFilter>): TreeFilter => ({
  query: input?.query?.trim() ?? '',
  parentId: input?.parentId ?? null,
  onlyRoots: Boolean(input?.onlyRoots),
  take: input?.take ?? DEFAULT_TREE_TAKE,
});

const isSameTreeFilter = (a: TreeFilter, b: TreeFilter) =>
  a.query === b.query &&
  a.parentId === b.parentId &&
  a.onlyRoots === b.onlyRoots &&
  a.take === b.take;

export const usePagesStore = create<PagesState>((set, get) => ({
  pagesBySpaceId: {},
  loadedBySpaceId: {},
  loadingBySpaceId: {},
  treePagesBySpaceId: {},
  treeLoadedBySpaceId: {},
  treeLoadingBySpaceId: {},
  treeHasMoreBySpaceId: {},
  treeCursorBySpaceId: {},
  treeFilterBySpaceId: {},

  invalidate: (spaceId) => {
    if (!spaceId) {
      set({ loadedBySpaceId: {} });
      return;
    }
    set((state) => ({
      loadedBySpaceId: { ...state.loadedBySpaceId, [spaceId]: false },
    }));
  },

  setPages: (spaceId, pages) =>
    set((state) => ({
      pagesBySpaceId: { ...state.pagesBySpaceId, [spaceId]: pages },
      loadedBySpaceId: { ...state.loadedBySpaceId, [spaceId]: true },
    })),

  upsertPage: (spaceId, page) =>
    set((state) => {
      const list = state.pagesBySpaceId[spaceId] ?? [];
      const index = list.findIndex((item) => item.id === page.id);
      const next = index >= 0 ? list.map((item) => (item.id === page.id ? page : item)) : [page, ...list];
      return {
        pagesBySpaceId: { ...state.pagesBySpaceId, [spaceId]: next },
      };
    }),

  removePage: (spaceId, pageId) =>
    set((state) => ({
      pagesBySpaceId: {
        ...state.pagesBySpaceId,
        [spaceId]: (state.pagesBySpaceId[spaceId] ?? []).filter(
          (page) => page.id !== pageId
        ),
      },
    })),

  getPageById: (pageId) => {
    const { pagesBySpaceId } = get();
    for (const pages of Object.values(pagesBySpaceId)) {
      const found = pages.find((page) => page.id === pageId);
      if (found) return found;
    }
    return undefined;
  },

  ensureLoaded: async (spaceId, options) => {
    if (!spaceId) return;
    const force = Boolean(options?.force);
    const state = get();
    const loaded = state.loadedBySpaceId[spaceId];
    if (!force && loaded) return;

    const pending = inflight.get(spaceId);
    if (!force && pending) return pending;

    const promise = (async () => {
      set((current) => ({
        loadingBySpaceId: { ...current.loadingBySpaceId, [spaceId]: true },
      }));
      try {
        const pages = await pagesApi.list(spaceId);
        set((current) => ({
          pagesBySpaceId: { ...current.pagesBySpaceId, [spaceId]: pages },
          loadedBySpaceId: { ...current.loadedBySpaceId, [spaceId]: true },
        }));
      } finally {
        inflight.delete(spaceId);
        set((current) => ({
          loadingBySpaceId: { ...current.loadingBySpaceId, [spaceId]: false },
        }));
      }
    })();

    inflight.set(spaceId, promise);
    return promise;
  },

  resetTree: (spaceId, filter) => {
    const nextFilter = normalizeTreeFilter(filter);
    set((state) => ({
      treePagesBySpaceId: { ...state.treePagesBySpaceId, [spaceId]: [] },
      treeCursorBySpaceId: { ...state.treeCursorBySpaceId, [spaceId]: null },
      treeHasMoreBySpaceId: { ...state.treeHasMoreBySpaceId, [spaceId]: true },
      treeLoadedBySpaceId: { ...state.treeLoadedBySpaceId, [spaceId]: false },
      treeFilterBySpaceId: { ...state.treeFilterBySpaceId, [spaceId]: nextFilter },
    }));
  },

  upsertTreePage: (spaceId, page) =>
    set((state) => {
      const list = state.treePagesBySpaceId[spaceId] ?? [];
      const index = list.findIndex((item) => item.id === page.id);
      const next =
        index >= 0
          ? list.map((item) => (item.id === page.id ? page : item))
          : [page, ...list];
      return {
        treePagesBySpaceId: { ...state.treePagesBySpaceId, [spaceId]: next },
        treeLoadedBySpaceId: { ...state.treeLoadedBySpaceId, [spaceId]: true },
      };
    }),

  removeTreeSubtree: (spaceId, pageId) => {
    const state = get();
    const pages = state.treePagesBySpaceId[spaceId] ?? [];
    if (!pages.length) return [];

    const exists = pages.some((p) => p.id === pageId);
    if (!exists) return [];

    set((current) => ({
      treePagesBySpaceId: {
        ...current.treePagesBySpaceId,
        [spaceId]: (current.treePagesBySpaceId[spaceId] ?? []).filter(
          (p) => p.id !== pageId
        ),
      },
    }));

    return [pageId];
  },

  ensureTreeLoaded: async (spaceId, options) => {
    if (!spaceId) return;
    const force = Boolean(options?.force);
    const state = get();
    const nextFilter = normalizeTreeFilter(options);
    const currentFilter = state.treeFilterBySpaceId[spaceId];
    const filterChanged = !currentFilter || !isSameTreeFilter(currentFilter, nextFilter);

    if (filterChanged) {
      get().resetTree(spaceId, nextFilter);
    }

    const loaded = state.treeLoadedBySpaceId[spaceId];
    if (!force && loaded && !filterChanged) return;

    const pending = treeInflight.get(spaceId);
    if (!force && pending) return pending;

    const promise = get().loadMoreTree(spaceId);
    treeInflight.set(spaceId, promise);
    await promise;
  },

  loadMoreTree: async (spaceId) => {
    if (!spaceId) return;
    const state = get();
    if (state.treeLoadingBySpaceId[spaceId]) return;
    if (state.treeHasMoreBySpaceId[spaceId] === false) return;

    const filter = state.treeFilterBySpaceId[spaceId] ?? normalizeTreeFilter();
    const cursor = state.treeCursorBySpaceId[spaceId] ?? null;

    const promise = (async () => {
      set((current) => ({
        treeLoadingBySpaceId: { ...current.treeLoadingBySpaceId, [spaceId]: true },
      }));
      try {
        const res = await pagesApi.listForTree(spaceId, {
          cursor,
          take: filter.take,
          query: filter.query || undefined,
          parentId: filter.parentId,
          onlyRoots: filter.onlyRoots,
        });

        const items = Array.isArray(res) ? res : res.items ?? [];
        const nextCursor =
          Array.isArray(res) ? null : res.nextCursor ?? null;
        const hasMore =
          Array.isArray(res) ? false : res.hasMore ?? Boolean(nextCursor);

        set((current) => ({
          treePagesBySpaceId: {
            ...current.treePagesBySpaceId,
            [spaceId]: cursor ? [...(current.treePagesBySpaceId[spaceId] ?? []), ...items] : items,
          },
          treeCursorBySpaceId: { ...current.treeCursorBySpaceId, [spaceId]: nextCursor },
          treeHasMoreBySpaceId: { ...current.treeHasMoreBySpaceId, [spaceId]: hasMore },
          treeLoadedBySpaceId: { ...current.treeLoadedBySpaceId, [spaceId]: true },
        }));
      } finally {
        treeInflight.delete(spaceId);
        set((current) => ({
          treeLoadingBySpaceId: { ...current.treeLoadingBySpaceId, [spaceId]: false },
        }));
      }
    })();

    treeInflight.set(spaceId, promise);
    return promise;
  },
}));

const EMPTY_PAGES: PageDto[] = [];
const EMPTY_TREE_PAGES: PageDto[] = [];

export const usePages = (spaceId: string | null | undefined) =>
  usePagesStore((s) =>
    spaceId ? s.pagesBySpaceId[spaceId] ?? EMPTY_PAGES : EMPTY_PAGES
  );

export const usePagesLoadedBySpace = (spaceId: string | null | undefined) =>
  usePagesStore((s) => (spaceId ? Boolean(s.loadedBySpaceId[spaceId]) : false));

export const usePagesLoadingBySpace = (spaceId: string | null | undefined) =>
  usePagesStore((s) => (spaceId ? Boolean(s.loadingBySpaceId[spaceId]) : false));

export const useTreePages = (spaceId: string | null | undefined) =>
  usePagesStore((s) =>
    spaceId ? s.treePagesBySpaceId[spaceId] ?? EMPTY_TREE_PAGES : EMPTY_TREE_PAGES
  );

export const useTreePagesLoaded = (spaceId: string | null | undefined) =>
  usePagesStore((s) => (spaceId ? Boolean(s.treeLoadedBySpaceId[spaceId]) : false));

export const useTreePagesLoading = (spaceId: string | null | undefined) =>
  usePagesStore((s) => (spaceId ? Boolean(s.treeLoadingBySpaceId[spaceId]) : false));

export const useTreePagesHasMore = (spaceId: string | null | undefined) =>
  usePagesStore((s) => (spaceId ? Boolean(s.treeHasMoreBySpaceId[spaceId]) : false));
