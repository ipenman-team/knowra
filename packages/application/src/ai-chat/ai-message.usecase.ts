import type { AiMessage, AiMessageRepository } from '@knowra/domain';
import { AiConversationNotFoundError } from './errors';
import type { AiConversationRepository } from '@knowra/domain';

export class AiMessageUseCase {
  constructor(
    private readonly conversationRepo: AiConversationRepository,
    private readonly messageRepo: AiMessageRepository,
  ) {}

  async create(params: {
    tenantId: string;
    conversationId: string;
    role: 'SYSTEM' | 'USER' | 'ASSISTANT';
    content: string;
    model?: string | null;
    actorUserId: string;
  }): Promise<AiMessage> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const content = (params.content ?? '').trim();
    if (!content) throw new Error('content is required');

    const conversation = await this.conversationRepo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!conversation) throw new AiConversationNotFoundError(params.conversationId);

    await this.conversationRepo.touch({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      actorUserId: params.actorUserId,
    });

    return await this.messageRepo.create({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      role: params.role,
      content,
      model: params.model ?? null,
      actorUserId: params.actorUserId,
    });
  }

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
