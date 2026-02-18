import type { CreateCommentModerationLogParams } from '../types';

export interface CommentModerationLogRepository {
  create(params: CreateCommentModerationLogParams): Promise<void>;
}
