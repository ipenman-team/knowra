import { knowraAiClient, getKnowraAiBaseUrl } from './client';
import type {
  AiAttachmentUploadResult,
  AiConversationDto,
  AiConversationSourcesDto,
  AiMessageDto,
} from './types';
import { ApiError, handleUnauthorized } from '../client';
import { getCurrentLocale } from '@/lib/i18n/locale';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export const knowraAiApi = {
  async createConversation(input?: { title?: string }) {
    const res = await knowraAiClient.post<AiConversationDto>(
      '/api/conversations',
      { title: input?.title },
    );
    return res.data;
  },

  async listConversations(input?: { limit?: number }) {
    const res = await knowraAiClient.get<AiConversationDto[]>('/api/conversations', {
      params: input?.limit ? { limit: input.limit } : undefined,
    });
    return res.data;
  },

  async listMessages(
    conversationId: string,
    input?: { limit?: number },
  ) {
    const res = await knowraAiClient.get<AiMessageDto[]>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        params: input?.limit ? { limit: input.limit } : undefined,
      },
    );
    return res.data;
  },

  async renameConversation(conversationId: string, input: { title: string }) {
    const res = await knowraAiClient.post<AiConversationDto>(
      `/api/conversations/${encodeURIComponent(conversationId)}/rename`,
      { title: input.title },
    );
    return res.data;
  },

  async deleteConversation(conversationId: string) {
    const res = await knowraAiClient.delete<{ ok: true }>(
      `/api/conversations/${encodeURIComponent(conversationId)}`,
    );
    return res.data;
  },

  async getConversationSources(conversationId: string) {
    const res = await knowraAiClient.get<AiConversationSourcesDto>(
      `/api/conversations/${encodeURIComponent(conversationId)}/sources`,
    );
    return res.data;
  },

  async updateConversationSources(
    conversationId: string,
    input: AiConversationSourcesDto,
  ) {
    const res = await knowraAiClient.post<AiConversationSourcesDto>(
      `/api/conversations/${encodeURIComponent(conversationId)}/sources`,
      input,
    );
    return res.data;
  },

  async chat(input: {
    conversationId: string;
    message: string;
    attachmentIds?: string[];
    dataSource?: {
      internetEnabled?: boolean;
      spaceEnabled?: boolean;
      spaceIds?: string[];
      enabled?: boolean;
      spaceId?: string | null;
    };
  }) {
    const res = await knowraAiClient.post<{ content: string; model: string }>(
      '/api/chat',
      input,
    );
    return res.data;
  },

  async chatStream(
    input: {
      conversationId: string;
      message: string;
      attachmentIds?: string[];
    },
    handlers: { onDelta: (delta: string) => void },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const baseUrl = getKnowraAiBaseUrl();
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        'Accept-Language': getCurrentLocale(),
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

  async uploadAttachments(
    input: { conversationId: string; files: File[] },
    options?: { signal?: AbortSignal; onUploadProgress?: (progress: number) => void },
  ) {
    const form = new FormData();
    form.append('conversationId', input.conversationId);
    for (const file of input.files) {
      form.append('files', file, file.name);
    }

    const res = await knowraAiClient.post<AiAttachmentUploadResult>(
      '/api/attachments',
      form,
      {
        signal: options?.signal,
        onUploadProgress: (e) => {
          const total = e.total ?? 0;
          if (!total) return;
          const ratio = e.loaded / total;
          const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
          options?.onUploadProgress?.(pct);
        },
      },
    );

    return res.data;
  },
};

export type {
  AiAttachmentDto,
  AiAttachmentUploadResult,
  AiConversationDto,
  AiConversationSourcesDto,
  AiMessageDto,
} from './types';
export { getKnowraAiBaseUrl } from './client';
