import type {
  AiConversation,
  AiConversationDataSource,
  AiConversationRepository,
} from '@contexta/domain';
import { AiConversationNotFoundError } from './errors';

function normalizeSpaceIds(spaceIds: unknown): string[] {
  if (!Array.isArray(spaceIds)) return [];
  const uniq = new Set<string>();
  for (const raw of spaceIds) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
}

function normalizeDataSource(raw: unknown): AiConversationDataSource {
  const obj =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const internetEnabled =
    obj.internetEnabled === undefined ? true : Boolean(obj.internetEnabled);
  const spaceEnabled =
    obj.spaceEnabled === undefined ? true : Boolean(obj.spaceEnabled);
  const carryContext =
    obj.carryContext === undefined ? true : Boolean(obj.carryContext);

  return {
    ...obj,
    internetEnabled,
    spaceEnabled,
    spaceIds: spaceEnabled ? normalizeSpaceIds(obj.spaceIds) : [],
    carryContext,
  };
}

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
  }): Promise<{
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    carryContext: boolean;
  }> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    const ds = normalizeDataSource(existed.dataSource);

    return {
      internetEnabled: ds.internetEnabled,
      spaceEnabled: ds.spaceEnabled,
      spaceIds: ds.spaceIds,
      carryContext: ds.carryContext,
    };
  }

  async updateSources(params: {
    tenantId: string;
    conversationId: string;
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    carryContext?: boolean;
    actorUserId: string;
  }): Promise<{
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    carryContext: boolean;
  }> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    const prev = normalizeDataSource(existed.dataSource);

    const internetEnabled = Boolean(params.internetEnabled);
    const spaceEnabled = Boolean(params.spaceEnabled);
    const spaceIds = spaceEnabled ? normalizeSpaceIds(params.spaceIds) : [];
    const carryContext =
      params.carryContext === undefined
        ? prev.carryContext
        : Boolean(params.carryContext);

    const next: AiConversationDataSource = {
      ...prev,
      internetEnabled,
      spaceEnabled,
      spaceIds,
      carryContext,
    };

    const updated = await this.repo.updateSources({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      dataSource: next,
      actorUserId: params.actorUserId,
    });

    const ds = normalizeDataSource(updated.dataSource);
    return {
      internetEnabled: ds.internetEnabled,
      spaceEnabled: ds.spaceEnabled,
      spaceIds: ds.spaceIds,
      carryContext: ds.carryContext,
    };
  }

  async delete(params: {
    tenantId: string;
    conversationId: string;
    actorUserId: string;
  }): Promise<void> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const existed = await this.repo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!existed) throw new AiConversationNotFoundError(params.conversationId);

    await this.repo.delete({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      actorUserId: params.actorUserId,
    });
  }
}
