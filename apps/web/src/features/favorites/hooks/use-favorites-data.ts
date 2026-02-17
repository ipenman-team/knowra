'use client';

import { useEffect, useMemo, useState } from 'react';
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
    error: null,
  });

  useEffect(() => {
    let canceled = false;

    async function loadCurrentSection() {
      const needLoadSpace = section === 'SPACE' && !spaceLoaded;
      const needLoadPage = section === 'PAGE' && !pageLoaded;
      if (!needLoadSpace && !needLoadPage) return;

      setState({ loading: true, error: null });

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
        setState({ loading: false, error: null });
      } catch (error) {
        if (canceled) return;
        setState({ loading: false, error: getFavoritesErrorMessage(error) });
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

  return {
    section,
    setSection,
    query,
    setQuery,
    state,
    spaceItems,
    pageItems,
  };
}
