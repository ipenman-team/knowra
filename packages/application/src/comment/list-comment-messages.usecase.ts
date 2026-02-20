import type {
  CommentRepository,
  ListCommentMessagesResult,
} from '@knowra/domain';
import { clampLimit, normalizeRequiredText } from './utils';

export class ListCommentMessagesUseCase {
  constructor(private readonly repo: CommentRepository) {}

  async list(params: {
    tenantId: string;
    threadId: string;
    cursor?: string | null;
    limit?: number | null;
    order?: 'asc' | 'desc' | null;
  }): Promise<ListCommentMessagesResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const threadId = normalizeRequiredText('threadId', params.threadId);

    const order = params.order === 'desc' ? 'desc' : 'asc';

    return this.repo.listMessages({
      tenantId,
      threadId,
      cursor: params.cursor ?? null,
      limit: clampLimit(params.limit, 30, 100),
      order,
    });
  }
}
