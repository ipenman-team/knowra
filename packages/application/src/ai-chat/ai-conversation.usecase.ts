import type {
  AiConversation,
  AiConversationRepository,
} from '@contexta/domain';

export class AiConversationUseCase {
  constructor(private readonly repo: AiConversationRepository) {}

  async create(params: {
    tenantId: string;
    title?: string | null;
    actorUserId: string;
  }): Promise<AiConversation> {
    const title = (params.title ?? '').trim() || '未命名对话';
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    return await this.repo.create({
      tenantId: params.tenantId,
      title,
      actorUserId: params.actorUserId,
    });
  }

  async list(params: {
    tenantId: string;
    limit?: number | null;
  }): Promise<AiConversation[]> {
    if (!params.tenantId) throw new Error('tenantId is required');
    const limit = Math.min(Math.max(Number(params.limit ?? 50), 1), 200);
    return await this.repo.list({ tenantId: params.tenantId, limit });
  }

  async getById(params: {
    tenantId: string;
    conversationId: string;
  }): Promise<AiConversation | null> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    return await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
  }
}
