import { favoritesApi, pagesApi, spacesApi } from '@/lib/api';
import type { FavoriteDto, FavoriteTargetType } from '@/lib/api/favorites';
import type { PageDto } from '@/lib/api/pages/types';
import type { SpaceDto } from '@/lib/api/spaces/types';
import type { FavoritePageItem, FavoriteSpaceItem } from '../types';

const FAVORITE_PAGE_SIZE = 200;
const SPACE_PAGE_SIZE = 200;
const PAGE_PAGE_SIZE = 200;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return '加载收藏失败';
}

function parseSpaceIdFromExtraData(extraData: unknown): string | null {
  if (!extraData || typeof extraData !== 'object' || Array.isArray(extraData)) {
    return null;
  }

  const value = (extraData as Record<string, unknown>).spaceId;
  if (typeof value !== 'string') return null;

  const spaceId = value.trim();
  return spaceId ? spaceId : null;
}

async function listAllFavorites(targetType: FavoriteTargetType): Promise<FavoriteDto[]> {
  const items: FavoriteDto[] = [];
  let skip = 0;

  while (true) {
    const result = await favoritesApi.list({
      targetType,
      skip,
      take: FAVORITE_PAGE_SIZE,
    });

    const batch = result.items ?? [];
    items.push(...batch);

    if (batch.length < FAVORITE_PAGE_SIZE) break;
    skip += FAVORITE_PAGE_SIZE;
  }

  return items;
}

async function listAllSpaces(): Promise<SpaceDto[]> {
  const items: SpaceDto[] = [];
  let skip = 0;

  while (true) {
    const result = await spacesApi.list({
      skip,
      take: SPACE_PAGE_SIZE,
      includeArchived: true,
    });

    const batch = result.items ?? [];
    items.push(...batch);

    if (batch.length < SPACE_PAGE_SIZE) break;
    skip += SPACE_PAGE_SIZE;
  }

  return items;
}

async function listAllPagesBySpace(spaceId: string): Promise<PageDto[]> {
  const items: PageDto[] = [];
  let skip = 0;

  while (true) {
    const batch = await pagesApi.list(spaceId, {
      skip,
      take: PAGE_PAGE_SIZE,
    });

    items.push(...batch);

    if (batch.length < PAGE_PAGE_SIZE) break;
    skip += PAGE_PAGE_SIZE;
  }

  return items;
}

function sortByFavoritedAtDesc<T extends { favoritedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.favoritedAt).getTime();
    const bTime = new Date(b.favoritedAt).getTime();
    return bTime - aTime;
  });
}

export async function fetchSpaceFavorites(): Promise<FavoriteSpaceItem[]> {
  const [favorites, spaces] = await Promise.all([
    listAllFavorites('SPACE'),
    listAllSpaces(),
  ]);

  const spaceMap = new Map(spaces.map((space) => [space.id, space]));

  const items: FavoriteSpaceItem[] = favorites.map((favorite) => {
    const space = spaceMap.get(favorite.targetId);

    return {
      favoriteId: favorite.id,
      targetId: favorite.targetId,
      name: space?.name?.trim() || '未命名空间',
      identifier: space?.identifier ?? null,
      favoritedAt: favorite.updatedAt,
    };
  });

  return sortByFavoritedAtDesc(items);
}

async function mapKnownPagesBySpace(
  favorites: FavoriteDto[],
  spaceMap: Map<string, SpaceDto>,
): Promise<Map<string, PageDto>> {
  const pageMap = new Map<string, PageDto>();
  const candidateSpaceIds = new Set<string>();

  for (const favorite of favorites) {
    const spaceId = parseSpaceIdFromExtraData(favorite.extraData);
    if (!spaceId || !spaceMap.has(spaceId)) continue;
    candidateSpaceIds.add(spaceId);
  }

  for (const spaceId of candidateSpaceIds) {
    const pages = await listAllPagesBySpace(spaceId);
    for (const page of pages) {
      pageMap.set(page.id, page);
    }
  }

  return pageMap;
}

async function resolveUnknownPages(
  pageMap: Map<string, PageDto>,
  favorites: FavoriteDto[],
  spaces: SpaceDto[],
): Promise<void> {
  const pending = new Set<string>();
  for (const favorite of favorites) {
    if (!pageMap.has(favorite.targetId)) pending.add(favorite.targetId);
  }

  if (pending.size === 0) return;

  for (const space of spaces) {
    if (pending.size === 0) break;

    const pages = await listAllPagesBySpace(space.id);
    for (const page of pages) {
      if (!pending.has(page.id)) continue;
      pageMap.set(page.id, page);
      pending.delete(page.id);
    }
  }
}

export async function fetchPageFavorites(): Promise<FavoritePageItem[]> {
  const [favorites, spaces] = await Promise.all([
    listAllFavorites('PAGE'),
    listAllSpaces(),
  ]);

  const spaceMap = new Map(spaces.map((space) => [space.id, space]));
  const pageMap = await mapKnownPagesBySpace(favorites, spaceMap);
  await resolveUnknownPages(pageMap, favorites, spaces);

  const items: FavoritePageItem[] = favorites.map((favorite) => {
    const page = pageMap.get(favorite.targetId);
    const explicitSpaceId = parseSpaceIdFromExtraData(favorite.extraData);
    const spaceId = page?.spaceId ?? explicitSpaceId ?? null;
    const space = spaceId ? spaceMap.get(spaceId) : null;

    return {
      favoriteId: favorite.id,
      targetId: favorite.targetId,
      name: page?.title?.trim() || '未命名页面',
      spaceId,
      spaceName: space?.name ?? null,
      spaceIdentifier: space?.identifier ?? null,
      favoritedAt: favorite.updatedAt,
    };
  });

  return sortByFavoritedAtDesc(items);
}

export function getFavoritesErrorMessage(error: unknown): string {
  return toErrorMessage(error);
}
