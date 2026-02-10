import type {
  CreateShareSnapshotParams,
  GetLatestShareSnapshotParams,
  ShareSnapshot,
} from '../types';

export interface ShareSnapshotRepository {
  create(params: CreateShareSnapshotParams): Promise<ShareSnapshot>;
  getLatestByShareId(params: GetLatestShareSnapshotParams): Promise<ShareSnapshot | null>;
}
