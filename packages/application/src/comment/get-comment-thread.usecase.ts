import type { CommentRepository, CommentThread } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class GetCommentThreadUseCase {
  constructor(private readonly repo: CommentRepository) {}

  async get(params: {
    tenantId: string;
    threadId: string;
  }): Promise<CommentThread | null> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const threadId = normalizeRequiredText('threadId', params.threadId);

    return this.repo.getThreadById({ tenantId, threadId });
  }
}
