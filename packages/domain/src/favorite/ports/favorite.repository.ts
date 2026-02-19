import type {
  CountFavoritesByTargetParams,
  DeleteFavoriteParams,
  Favorite,
  GetFavoriteParams,
  ListFavoritesParams,
  ListFavoritesResult,
  UpsertFavoriteParams,
} from '../types';

export interface FavoriteRepository {
  upsert(params: UpsertFavoriteParams): Promise<Favorite>;
  softDelete(params: DeleteFavoriteParams): Promise<void>;
  get(params: GetFavoriteParams): Promise<Favorite | null>;
  countByTarget(params: CountFavoritesByTargetParams): Promise<number>;
  list(params: ListFavoritesParams): Promise<ListFavoritesResult>;
}
