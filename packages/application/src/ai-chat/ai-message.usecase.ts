import type { AiMessage, AiMessageRepository } from '@contexta/domain';
import { AiConversationNotFoundError } from './errors';
import type { AiConversationRepository } from '@contexta/domain';

export class AiMessageUseCase {
  constructor(
    private readonly conversationRepo: AiConversationRepository,
    private readonly messageRepo: AiMessageRepository,
  ) {}

  async listByConversation(params: {
    tenantId: string;
    conversationId: string;
    limit?: number | null;
  }): Promise<AiMessage[]> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');

    const conversation = await this.conversationRepo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!conversation) throw new AiConversationNotFoundError(params.conversationId);

    const limit = Math.min(Math.max(Number(params.limit ?? 200), 1), 500);
    return await this.messageRepo.listByConversation({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      limit,
    });
  }
}
