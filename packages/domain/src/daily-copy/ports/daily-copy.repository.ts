import type {
  CreateDailyCopyParams,
  DailyCopy,
  FindDailyCopyParams,
  UpdateDailyCopyMetadataParams,
} from '../types';

export interface DailyCopyRepository {
  findByDay(params: FindDailyCopyParams): Promise<DailyCopy | null>;
  create(params: CreateDailyCopyParams): Promise<DailyCopy>;
  updateMetadata(params: UpdateDailyCopyMetadataParams): Promise<DailyCopy>;
}
