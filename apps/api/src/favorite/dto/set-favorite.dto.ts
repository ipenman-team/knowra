export type SetFavoriteDto = {
  targetType: string;
  targetId: string;
  favorite: boolean;
  extraData?: unknown;
};
