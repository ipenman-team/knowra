export const FavoriteTarget = {
  Space: 'SPACE',
  Page: 'PAGE',
  PageLike: 'PAGE_LIKE',
} as const;

export type FavoriteKnownTargetType =
  (typeof FavoriteTarget)[keyof typeof FavoriteTarget];

export type FavoriteTargetType = FavoriteKnownTargetType | string;

export type FavoriteExtraData = unknown;

export type Favorite = {
  id: string;
  tenantId: string;
  userId: string;

  targetType: FavoriteTargetType;
  targetId: string;
  extraData?: FavoriteExtraData | null;

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertFavoriteParams = {
  tenantId: string;
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
  extraData?: FavoriteExtraData | null;
};

export type DeleteFavoriteParams = {
  tenantId: string;
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
};

export type GetFavoriteParams = {
  tenantId: string;
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
};

export type ListFavoritesParams = {
  tenantId: string;
  userId: string;

  targetType?: FavoriteTargetType | null;
  targetIds?: string[] | null;

  skip?: number | null;
  take?: number | null;
};

export type ListFavoritesResult = {
  items: Favorite[];
  total: number;
};

export type CountFavoritesByTargetParams = {
  tenantId: string;
  targetType: FavoriteTargetType;
  targetId: string;
};
