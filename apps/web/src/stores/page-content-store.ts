"use client";

import { create } from 'zustand';
import type { PageDto } from '@/lib/api';
import type { PageVersionDto } from '@/lib/api/pages/types';
import {
  parseContentToSlateValue,
  type SlateValue,
} from '@/components/shared/slate-editor';

interface PageContentState {
  // Active page data
  activePage: PageDto | null;
  pageMode: 'edit' | 'preview';
  pageLoading: boolean;

  // Editor state
  pageTitle: string;
  editorValue: SlateValue;

  // Save state
  pageSaving: boolean;
  pagePublishing: boolean;
  lastSavedAt: string | null;

  // Published snapshot
  publishedSnapshot: {
    title: string;
    content: unknown;
    updatedBy: string;
    updatedAt: string;
  } | null;

  // Versions
  pageVersions: PageVersionDto[];
  versionsLoading: boolean;

  // Actions
  setActivePage: (page: PageDto | null) => void;
  setPageMode: (mode: 'edit' | 'preview') => void;
  setPageLoading: (loading: boolean) => void;
  setPageTitle: (title: string) => void;
  setEditorValue: (value: SlateValue) => void;
  setPageSaving: (saving: boolean) => void;
  setPagePublishing: (publishing: boolean) => void;
  setLastSavedAt: (timestamp: string | null) => void;
  setPublishedSnapshot: (
    snapshot: PageContentState['publishedSnapshot']
  ) => void;
  setVersionsLoading: (loading: boolean) => void;
  resetPageContent: () => void;
}

const initialEditorValue = parseContentToSlateValue('');

export const usePageContentStore = create<PageContentState>((set) => ({
  activePage: null,
  pageMode: 'preview',
  pageLoading: false,
  pageTitle: '',
  editorValue: initialEditorValue,
  pageSaving: false,
  pagePublishing: false,
  lastSavedAt: null,
  publishedSnapshot: null,
  pageVersions: [],
  versionsLoading: false,

  setActivePage: (activePage) => set({ activePage }),
  setPageMode: (pageMode) => set({ pageMode }),
  setPageLoading: (pageLoading) => set({ pageLoading }),
  setPageTitle: (pageTitle) => set({ pageTitle }),
  setEditorValue: (editorValue) => set({ editorValue }),
  setPageSaving: (pageSaving) => set({ pageSaving }),
  setPagePublishing: (pagePublishing) => set({ pagePublishing }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setPublishedSnapshot: (publishedSnapshot) => set({ publishedSnapshot }),
  setVersionsLoading: (versionsLoading) => set({ versionsLoading }),

  resetPageContent: () =>
    set({
      activePage: null,
      pageMode: 'preview',
      pageTitle: '',
      lastSavedAt: null,
      publishedSnapshot: null,
    }),
}));

// Selector hooks for granular subscriptions
export const usePageMode = () => usePageContentStore((s) => s.pageMode);
export const usePageTitle = () => usePageContentStore((s) => s.pageTitle);
export const useEditorValue = () => usePageContentStore((s) => s.editorValue);
export const usePageSaveState = () =>
  usePageContentStore((s) => ({
    saving: s.pageSaving,
    lastSavedAt: s.lastSavedAt,
  }));
