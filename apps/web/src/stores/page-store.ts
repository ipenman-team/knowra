import { create } from 'zustand';

import { pagesApi, type PageDto } from '@/lib/api';
import { parseContentToSlateValue } from '@/components/shared/slate-editor';

import { usePageContentStore } from './page-content-store';
import { usePageSelectionStore } from './page-selection-store';
import { usePagesStore } from './pages-store';
import { useSpaceStore } from './space-store';

interface PageStoreState {
  pageId: string | null;
  page: PageDto | null;
  loading: boolean;
  loaded: boolean;

  ensureLoaded: (pageId: string, options?: { force?: boolean }) => Promise<PageDto | null>;
  destroy: () => void;

  setDraftTitle: (title: string) => void;
  patchPage: (page: PageDto) => void;
}

const inflight = new Map<string, Promise<PageDto>>();

function resolveSpaceIdForPage(pageId: string): string | null {
  const fromCache = usePagesStore.getState().getPageById(pageId)?.spaceId;
  if (fromCache) return fromCache;
  return useSpaceStore.getState().currentSpaceId ?? null;
}

function resetPageContentStores() {
  const content = usePageContentStore.getState();
  content.setPageLoading(false);
  content.setPageSaving(false);
  content.setPagePublishing(false);
  content.setLastSavedAt(null);
  content.setPageMode('preview');
  content.setPublishedSnapshot(null);
  content.setPageVersions([]);
  content.setVersionsLoading(false);
  content.setActivePage(null);
  content.setPageTitle('');
  content.setEditorValue(parseContentToSlateValue(''));
}

export const usePageStore = create<PageStoreState>((set, get) => ({
  pageId: null,
  page: null,
  loading: false,
  loaded: false,

  destroy: () => {
    inflight.clear();
    set({ pageId: null, page: null, loading: false, loaded: false });
    resetPageContentStores();
  },

  ensureLoaded: async (pageId, options) => {
    if (!pageId) {
      get().destroy();
      return null;
    }

    const force = Boolean(options?.force);
    const state = get();
    if (!force && state.pageId === pageId && state.loaded && state.page) {
      return state.page;
    }

    set({ pageId, loading: true, loaded: false });

    const { setPageLoading } = usePageContentStore.getState();
    setPageLoading(true);

    const spaceId = resolveSpaceIdForPage(pageId) ?? undefined;
    const inflightKey = spaceId ? `${spaceId}:${pageId}` : pageId;
    const existing = inflight.get(inflightKey);
    const req = !force && existing
      ? existing
      : pagesApi.get(...(spaceId ? ([spaceId, pageId] as const) : ([pageId] as const))).finally(() => {
          inflight.delete(inflightKey);
        });

    inflight.set(inflightKey, req);

    try {
      const page = await req;

      // Ignore stale responses if user switched pages mid-flight.
      if (get().pageId !== pageId) return null;

      set({ pageId, page, loading: false, loaded: true });

      const contentStore = usePageContentStore.getState();
      contentStore.setActivePage(page);
      contentStore.setPageTitle(page.title ?? '');
      contentStore.setEditorValue(parseContentToSlateValue(page.content));
      contentStore.setPublishedSnapshot(null);
      contentStore.setPageLoading(false);

      return page;
    } catch {
      if (get().pageId !== pageId) return null;
      set({ loading: false, loaded: false, page: null });
      usePageContentStore.getState().setPageLoading(false);
      return null;
    }
  },

  setDraftTitle: (title) => {
    const state = get();
    usePageContentStore.getState().setPageTitle(title);

    if (state.page) {
      set({ page: { ...state.page, title } });
    }

    // Keep selection title in sync so the rest of UI can rely on it.
    const selection = usePageSelectionStore.getState();
    const selected = selection.selected;
    if (selected.kind === 'page' && selected.id === state.pageId) {
      selection.setSelectedPage(selected.id, title);
    }
  },

  patchPage: (page) => {
    const state = get();
    if (state.pageId !== page.id) return;
    set({ page });

    const contentStore = usePageContentStore.getState();
    if (contentStore.activePage?.id === page.id) {
      contentStore.setActivePage(page);
      contentStore.setPageTitle(page.title ?? '');
    }

    const selection = usePageSelectionStore.getState();
    const selected = selection.selected;
    if (selected.kind === 'page' && selected.id === page.id) {
      selection.setSelectedPage(page.id, page.title ?? '');
    }
  },
}));

export const useActivePage = () => usePageStore((s) => s.page);
export const useActivePageId = () => usePageStore((s) => s.pageId);
export const useActivePageLoading = () => usePageStore((s) => s.loading);
