import type {
  AiConversation,
  AiConversationRepository,
} from '@contexta/domain';
import { AiConversationNotFoundError } from './errors';

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

  async renameTitle(params: {
    tenantId: string;
    conversationId: string;
    title?: string | null;
    actorUserId: string;
  }): Promise<AiConversation> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const title = (params.title ?? '').trim() || '未命名对话';

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    return await this.repo.renameTitle({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      title,
      actorUserId: params.actorUserId,
    });
  }

  async getSources(params: {
    tenantId: string;
    conversationId: string;
  }): Promise<{ internetEnabled: boolean; spaceEnabled: boolean; spaceIds: string[] }> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    return {
      internetEnabled: Boolean(existed.internetEnabled),
      spaceEnabled: Boolean(existed.spaceEnabled),
      spaceIds: Array.isArray(existed.spaceIds) ? existed.spaceIds : [],
    };
  }

  async updateSources(params: {
    tenantId: string;
    conversationId: string;
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    actorUserId: string;
  }): Promise<{ internetEnabled: boolean; spaceEnabled: boolean; spaceIds: string[] }> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    const internetEnabled = Boolean(params.internetEnabled);
    const spaceEnabled = Boolean(params.spaceEnabled);
    const spaceIds = Array.isArray(params.spaceIds) ? params.spaceIds : [];

    const updated = await this.repo.updateSources({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      internetEnabled,
      spaceEnabled,
      spaceIds,
      actorUserId: params.actorUserId,
    });

    return {
      internetEnabled: Boolean(updated.internetEnabled),
      spaceEnabled: Boolean(updated.spaceEnabled),
      spaceIds: Array.isArray(updated.spaceIds) ? updated.spaceIds : [],
    };
  }
}
