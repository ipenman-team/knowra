import type { CreateDailyCopyParams, DailyCopy, FindDailyCopyParams } from '../types';

export interface DailyCopyRepository {
  findByDay(params: FindDailyCopyParams): Promise<DailyCopy | null>;
  create(params: CreateDailyCopyParams): Promise<DailyCopy>;
}
