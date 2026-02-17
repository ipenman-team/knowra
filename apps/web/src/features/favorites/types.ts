export type FavoriteSection = 'SPACE' | 'PAGE';

export type FavoriteSpaceItem = {
  favoriteId: string;
  targetId: string;
  name: string;
  identifier: string | null;
  favoritedAt: string;
};

export type FavoritePageItem = {
  favoriteId: string;
  targetId: string;
  name: string;
  spaceId: string | null;
  spaceName: string | null;
  spaceIdentifier: string | null;
  favoritedAt: string;
};

export type FavoriteListState = {
  loading: boolean;
  error: string | null;
};
