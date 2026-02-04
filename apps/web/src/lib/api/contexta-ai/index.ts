import { contextaAiClient, getContextaAiBaseUrl } from './client';
import type { AiConversationDto, AiMessageDto } from './types';
import { ApiError, handleUnauthorized } from '../client';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

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

  async renameConversation(conversationId: string, input: { title: string }) {
    const res = await contextaAiClient.post<AiConversationDto>(
      `/api/conversations/${encodeURIComponent(conversationId)}/rename`,
      { title: input.title },
    );
    return res.data;
  },

  async chat(input: {
    conversationId: string;
    message: string;
    dataSource?: {
      // New: 信息源设置
      internetEnabled?: boolean;
      spaceEnabled?: boolean;
      spaceIds?: string[];
      // Backward compatible
      enabled?: boolean;
      spaceId?: string | null;
    };
  }) {
    const res = await contextaAiClient.post<{ content: string; model: string }>(
      '/api/chat',
      input,
    );
    return res.data;
  },

  async chatStream(
    input: {
      conversationId: string;
      message: string;
      dataSource?: {
        // New: 信息源设置
        internetEnabled?: boolean;
        spaceEnabled?: boolean;
        spaceIds?: string[];
        // Backward compatible
        enabled?: boolean;
        spaceId?: string | null;
      };
    },
    handlers: { onDelta: (delta: string) => void },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const baseUrl = getContextaAiBaseUrl();
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify(input),
      signal: options?.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 401) {
        void handleUnauthorized();
      }
      throw new ApiError(text || `HTTP ${res.status}`, res.status, text);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('stream not supported');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        const lines = rawEvent
          .split('\n')
          .map((l) => l.trimEnd())
          .filter(Boolean);

        let eventName = 'message';
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice('event:'.length).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice('data:'.length).trimStart());
          }
        }

        if (dataLines.length === 0) continue;
        const dataStr = dataLines.join('\n').trim();
        if (!dataStr) continue;

        let payload: unknown = dataStr;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          // keep string
        }

        if (eventName === 'delta') {
          const delta =
            typeof payload === 'string'
              ? payload
              : isRecord(payload)
                ? String(payload.delta ?? '')
                : '';
          if (delta) handlers.onDelta(delta);
          continue;
        }

        if (eventName === 'error') {
          const message =
            typeof payload === 'string'
              ? payload
              : isRecord(payload)
                ? String(payload.message ?? 'stream error')
                : 'stream error';
          throw new Error(message);
        }

        if (eventName === 'done') {
          return;
        }
      }
    }
  },
};

export type { AiConversationDto, AiMessageDto } from './types';
export { getContextaAiBaseUrl } from './client';
