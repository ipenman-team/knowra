import type {
  CommentRepository,
  CommentSource,
  CommentThreadStatus,
  ListCommentThreadsResult,
} from '@contexta/domain';
import { clampLimit, normalizeRequiredText } from './utils';

export class ListCommentThreadsUseCase {
  constructor(private readonly repo: CommentRepository) {}

  async list(params: {
    tenantId: string;
    pageId: string;
    shareId?: string | null;
    source?: CommentSource | 'ALL' | null;
    status?: CommentThreadStatus | 'ALL' | null;
    cursor?: string | null;
    limit?: number | null;
  }): Promise<ListCommentThreadsResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const pageId = normalizeRequiredText('pageId', params.pageId);

    const source = params.source && params.source !== 'ALL' ? params.source : null;
    const status = params.status && params.status !== 'ALL' ? params.status : null;

    return this.repo.listThreads({
      tenantId,
      pageId,
      shareId: params.shareId ?? null,
      source,
      status,
      cursor: params.cursor ?? null,
      limit: clampLimit(params.limit, 20, 50),
    });
  }
}
