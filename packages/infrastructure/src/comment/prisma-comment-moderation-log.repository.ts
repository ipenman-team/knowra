import type {
  CommentModerationLogRepository,
  CreateCommentModerationLogParams,
} from '@knowra/domain';
import type { Prisma, PrismaClient } from '@prisma/client';

export class PrismaCommentModerationLogRepository
  implements CommentModerationLogRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: CreateCommentModerationLogParams): Promise<void> {
    await this.prisma.commentModerationLog.create({
      data: {
        tenantId: params.tenantId,
        pageId: params.pageId,
        threadId: params.threadId ?? null,
        messageId: params.messageId ?? null,
        actorType: params.actorType ?? null,
        actorUserId: params.actorUserId ?? null,
        actorGuestId: params.actorGuestId ?? null,
        inputTextHash: params.inputTextHash,
        result: params.result,
        hitCategories:
          params.hitCategories == null
            ? undefined
            : (params.hitCategories as Prisma.InputJsonValue),
        hitTerms:
          params.hitTerms == null
            ? undefined
            : (params.hitTerms as Prisma.InputJsonValue),
        policyVersion: params.policyVersion ?? null,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      },
    });
  }
}
