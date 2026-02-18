import type {
  CommentModerationLogRepository,
  CommentRepository,
  CommentCreateResult,
  CommentAuthorType,
  ModerateCommentContentResult,
} from '@contexta/domain';
import { ModerateCommentContentUseCase } from './moderate-comment-content.usecase';
import { normalizeRequiredText, toContentText } from './utils';
import * as crypto from 'node:crypto';

export type ReplyCommentThreadResult =
  | {
      kind: 'created';
      moderation: ModerateCommentContentResult;
      data: CommentCreateResult;
    }
  | {
      kind: 'moderated';
      moderation: ModerateCommentContentResult;
    };

export class ReplyCommentThreadUseCase {
  constructor(
    private readonly repo: CommentRepository,
    private readonly moderationLogRepo: CommentModerationLogRepository,
    private readonly moderateUseCase: ModerateCommentContentUseCase,
  ) {}

  async reply(params: {
    tenantId: string;
    threadId: string;
    content: unknown;
    parentId?: string | null;
    replyToMessageId?: string | null;
    authorType: CommentAuthorType;
    authorUserId?: string | null;
    authorGuestId?: string | null;
    actorUserId: string;
  }): Promise<ReplyCommentThreadResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const threadId = normalizeRequiredText('threadId', params.threadId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const thread = await this.repo.getThreadById({ tenantId, threadId });
    if (!thread) throw new Error('thread not found');

    const contentText = toContentText(params.content);
    const moderation = this.moderateUseCase.moderate({ text: contentText });

    if (moderation.status !== 'PASS') {
      await this.moderationLogRepo.create({
        tenantId,
        pageId: thread.pageId,
        threadId,
        actorType: params.authorType,
        actorUserId: params.authorUserId ?? null,
        actorGuestId: params.authorGuestId ?? null,
        inputTextHash: crypto.createHash('sha256').update(contentText).digest('hex'),
        result: moderation.status,
        hitCategories: moderation.riskCategories,
        hitTerms: moderation.hitTerms,
        policyVersion: moderation.policyVersion,
        actorId: actorUserId,
      });

      return {
        kind: 'moderated',
        moderation,
      };
    }

    const created = await this.repo.replyThreadWithMessage({
      tenantId,
      threadId,
      parentId: params.parentId ?? null,
      replyToMessageId: params.replyToMessageId ?? null,
      authorType: params.authorType,
      authorUserId: params.authorUserId ?? null,
      authorGuestId: params.authorGuestId ?? null,
      content: params.content,
      contentText,
      moderationStatus: moderation.status,
      riskCategories: moderation.riskCategories,
      riskScore: moderation.riskScore,
      actorUserId,
    });

    return {
      kind: 'created',
      moderation,
      data: created,
    };
  }
}
