'use client';

import { useEffect, useMemo, useState } from 'react';
import { favoritesApi } from '@/lib/api';
import type {
  FavoriteListState,
  FavoritePageItem,
  FavoriteSection,
  FavoriteSpaceItem,
} from '../types';
import {
  fetchPageFavorites,
  fetchSpaceFavorites,
  getFavoritesErrorMessage,
} from '../services/favorites.service';

type FavoriteDataState = {
  section: FavoriteSection;
  setSection: (section: FavoriteSection) => void;
  query: string;
  setQuery: (query: string) => void;
  state: FavoriteListState;
  spaceItems: FavoriteSpaceItem[];
  pageItems: FavoritePageItem[];
  cancelFavorites: (favoriteIds: string[]) => Promise<{
    removedIds: string[];
    failedCount: number;
  }>;
};

function normalizeKeyword(query: string): string {
  return query.trim().toLowerCase();
}

function filterSpaceItems(
  items: FavoriteSpaceItem[],
  query: string,
): FavoriteSpaceItem[] {
  const keyword = normalizeKeyword(query);
  if (!keyword) return items;

  return items.filter((item) => {
    const name = item.name.toLowerCase();
    const identifier = (item.identifier ?? '').toLowerCase();
    return name.includes(keyword) || identifier.includes(keyword);
  });
}

function filterPageItems(items: FavoritePageItem[], query: string): FavoritePageItem[] {
  const keyword = normalizeKeyword(query);
  if (!keyword) return items;

  return items.filter((item) => {
    const name = item.name.toLowerCase();
    const spaceName = (item.spaceName ?? '').toLowerCase();
    const spaceIdentifier = (item.spaceIdentifier ?? '').toLowerCase();

    return (
      name.includes(keyword) ||
      spaceName.includes(keyword) ||
      spaceIdentifier.includes(keyword)
    );
  });
}

export function useFavoritesData(): FavoriteDataState {
  const [section, setSection] = useState<FavoriteSection>('SPACE');
  const [query, setQuery] = useState('');
  const [spaceItemsRaw, setSpaceItemsRaw] = useState<FavoriteSpaceItem[]>([]);
  const [pageItemsRaw, setPageItemsRaw] = useState<FavoritePageItem[]>([]);
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [state, setState] = useState<FavoriteListState>({
    loading: false,
    canceling: false,
    error: null,
  });

  useEffect(() => {
    let canceled = false;

    async function loadCurrentSection() {
      const needLoadSpace = section === 'SPACE' && !spaceLoaded;
      const needLoadPage = section === 'PAGE' && !pageLoaded;
      if (!needLoadSpace && !needLoadPage) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        if (needLoadSpace) {
          const items = await fetchSpaceFavorites();
          if (canceled) return;
          setSpaceItemsRaw(items);
          setSpaceLoaded(true);
        }

        if (needLoadPage) {
          const items = await fetchPageFavorites();
          if (canceled) return;
          setPageItemsRaw(items);
          setPageLoaded(true);
        }

        if (canceled) return;
        setState((prev) => ({ ...prev, loading: false, error: null }));
      } catch (error) {
        if (canceled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getFavoritesErrorMessage(error),
        }));
      }
    }

    void loadCurrentSection();

    return () => {
      canceled = true;
    };
  }, [pageLoaded, section, spaceLoaded]);

  const spaceItems = useMemo(
    () => filterSpaceItems(spaceItemsRaw, query),
    [query, spaceItemsRaw],
  );

  const pageItems = useMemo(
    () => filterPageItems(pageItemsRaw, query),
    [pageItemsRaw, query],
  );

  async function cancelFavorites(favoriteIds: string[]) {
    const uniqIds = [...new Set(favoriteIds)];
    if (uniqIds.length === 0) {
      return { removedIds: [], failedCount: 0 };
    }

    const source = section === 'SPACE' ? spaceItemsRaw : pageItemsRaw;
    const pendingItems = source.filter((item) => uniqIds.includes(item.favoriteId));
    if (pendingItems.length === 0) {
      return { removedIds: [], failedCount: 0 };
    }

    setState((prev) => ({ ...prev, canceling: true, error: null }));

    const removedIds: string[] = [];
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        await favoritesApi.set({
          targetType: section,
          targetId: item.targetId,
          favorite: false,
        });
        removedIds.push(item.favoriteId);
      } catch {
        failedCount += 1;
      }
    }

    if (removedIds.length > 0) {
      if (section === 'SPACE') {
        setSpaceItemsRaw((prev) =>
          prev.filter((item) => !removedIds.includes(item.favoriteId)),
        );
      } else {
        setPageItemsRaw((prev) =>
          prev.filter((item) => !removedIds.includes(item.favoriteId)),
        );
      }
    }

    setState((prev) => ({
      ...prev,
      canceling: false,
      error: prev.error,
    }));

    return { removedIds, failedCount };
  }

  return {
    section,
    setSection,
    query,
    setQuery,
    state,
    spaceItems,
    pageItems,
    cancelFavorites,
  };
}
