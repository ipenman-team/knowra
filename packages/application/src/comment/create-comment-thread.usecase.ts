import type {
  CommentModerationLogRepository,
  CommentRepository,
  CommentCreateResult,
  CommentAuthorType,
  CommentSource,
  ModerateCommentContentResult,
} from '@knowra/domain';
import { ModerateCommentContentUseCase } from './moderate-comment-content.usecase';
import { normalizeRequiredText, toContentText } from './utils';
import * as crypto from 'node:crypto';

export type CreateCommentThreadResult =
  | {
      kind: 'created';
      moderation: ModerateCommentContentResult;
      data: CommentCreateResult;
    }
  | {
      kind: 'moderated';
      moderation: ModerateCommentContentResult;
    };

export class CreateCommentThreadUseCase {
  constructor(
    private readonly repo: CommentRepository,
    private readonly moderationLogRepo: CommentModerationLogRepository,
    private readonly moderateUseCase: ModerateCommentContentUseCase,
  ) {}

  async create(params: {
    tenantId: string;
    spaceId: string;
    pageId: string;
    shareId?: string | null;
    source: CommentSource;
    content: unknown;
    quoteText?: string | null;
    anchorType?: string | null;
    anchorPayload?: unknown | null;
    authorType: CommentAuthorType;
    authorUserId?: string | null;
    authorGuestId?: string | null;
    authorGuestNickname?: string | null;
    authorGuestEmail?: string | null;
    actorUserId: string;
  }): Promise<CreateCommentThreadResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const pageId = normalizeRequiredText('pageId', params.pageId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    const contentText = toContentText(params.content);
    const moderation = this.moderateUseCase.moderate({ text: contentText });

    if (moderation.status !== 'PASS') {
      await this.moderationLogRepo.create({
        tenantId,
        pageId,
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

    const created = await this.repo.createThreadWithMessage({
      tenantId,
      spaceId,
      pageId,
      shareId: params.shareId ?? null,
      source: params.source,
      quoteText: params.quoteText ?? null,
      anchorType: params.anchorType ?? null,
      anchorPayload: params.anchorPayload ?? null,
      authorType: params.authorType,
      authorUserId: params.authorUserId ?? null,
      authorGuestId: params.authorGuestId ?? null,
      authorGuestNickname: params.authorGuestNickname ?? null,
      authorGuestEmail: params.authorGuestEmail ?? null,
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
