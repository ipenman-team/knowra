import type {
  CommentRepository,
  CommentThread,
  CommentThreadStatus,
} from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class ResolveCommentThreadUseCase {
  constructor(private readonly repo: CommentRepository) {}

  async resolve(params: {
    tenantId: string;
    threadId: string;
    status: Extract<CommentThreadStatus, 'OPEN' | 'RESOLVED'>;
    actorUserId: string;
  }): Promise<CommentThread> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const threadId = normalizeRequiredText('threadId', params.threadId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    return this.repo.resolveThread({
      tenantId,
      threadId,
      status: params.status,
      actorUserId,
    });
  }
}
