import type { CreateShareAccessLogParams, ShareAccessLog } from '../types';

export interface ShareAccessLogRepository {
  create(params: CreateShareAccessLogParams): Promise<ShareAccessLog>;
}
