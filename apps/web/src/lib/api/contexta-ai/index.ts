import { contextaAiClient } from './client';
import type { AiConversationDto, AiMessageDto } from './types';

export const contextaAiApi = {
  async createConversation(input?: { title?: string }) {
    const res = await contextaAiClient.post<AiConversationDto>(
      '/api/conversations',
      { title: input?.title },
    );
    return res.data;
  },

  async listConversations(input?: { limit?: number }) {
    const res = await contextaAiClient.get<AiConversationDto[]>('/api/conversations', {
      params: input?.limit ? { limit: input.limit } : undefined,
    });
    return res.data;
  },

  async listMessages(
    conversationId: string,
    input?: { limit?: number },
  ) {
    const res = await contextaAiClient.get<AiMessageDto[]>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        params: input?.limit ? { limit: input.limit } : undefined,
      },
    );
    return res.data;
  },
};

export type { AiConversationDto, AiMessageDto } from './types';
export { getContextaAiBaseUrl } from './client';
