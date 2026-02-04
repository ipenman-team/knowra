import type { AiConversation, AiConversationDataSource } from '../types';

export interface AiConversationRepository {
  create(params: {
    tenantId: string;
    title: string;
    actorUserId: string;
  }): Promise<AiConversation>;

  list(params: {
    tenantId: string;
    limit: number;
  }): Promise<AiConversation[]>;

  getById(params: {
    tenantId: string;
    conversationId: string;
  }): Promise<AiConversation | null>;

  renameTitle(params: {
    tenantId: string;
    conversationId: string;
    title: string;
    actorUserId: string;
  }): Promise<AiConversation>;

  updateSources(params: {
    tenantId: string;
    conversationId: string;
    dataSource: AiConversationDataSource;
    actorUserId: string;
  }): Promise<AiConversation>;

  touch(params: {
    tenantId: string;
    conversationId: string;
    actorUserId: string;
  }): Promise<void>;
}
