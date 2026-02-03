import type { AiMessage, AiMessageRole } from '../types';

export interface AiMessageRepository {
  create(params: {
    tenantId: string;
    conversationId: string;
    role: AiMessageRole;
    content: string;
    model?: string | null;
    actorUserId: string;
  }): Promise<AiMessage>;

  listByConversation(params: {
    tenantId: string;
    conversationId: string;
    limit: number;
  }): Promise<AiMessage[]>;
}
