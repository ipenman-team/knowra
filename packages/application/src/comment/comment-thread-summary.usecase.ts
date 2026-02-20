import type {
  CommentRepository,
  CommentThreadCounts,
} from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class CommentThreadSummaryUseCase {
  constructor(private readonly repo: CommentRepository) {}

  async summary(params: {
    tenantId: string;
    pageId: string;
    shareId?: string | null;
  }): Promise<CommentThreadCounts> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const pageId = normalizeRequiredText('pageId', params.pageId);

    return this.repo.countThreadSummary({
      tenantId,
      pageId,
      shareId: params.shareId ?? null,
    });
  }
}
