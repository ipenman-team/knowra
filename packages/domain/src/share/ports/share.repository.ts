import type {
  CreateShareParams,
  GetShareByIdParams,
  GetShareByPublicIdParams,
  ListSharesParams,
  ListSharesResult,
  Share,
  UpdateShareStatusParams,
} from '../types';

export interface ShareRepository {
  create(params: CreateShareParams): Promise<Share>;
  getById(params: GetShareByIdParams): Promise<Share | null>;
  getByPublicId(params: GetShareByPublicIdParams): Promise<Share | null>;
  list(params: ListSharesParams): Promise<ListSharesResult>;
  updateStatus(params: UpdateShareStatusParams): Promise<Share>;
}
