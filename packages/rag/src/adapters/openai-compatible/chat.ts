import type { ChatProvider, ChatMessage } from '../../ports/chat-provider';
import type { OpenAICompatibleChatConfig } from './types';
import { postJson } from './http';

type ChatCompletionsResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: unknown;
};

export class OpenAICompatibleChatProvider implements ChatProvider {
  public readonly model: string;
  private readonly url: string;
  private readonly apiKey: string;

  constructor(private readonly config: OpenAICompatibleChatConfig) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  }

  async generate(messages: ChatMessage[]) {
    const payload = {
      model: this.model,
      messages,
    };

    const data = await postJson<ChatCompletionsResponse>(this.url, this.apiKey, payload);
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content: String(content), usage: data.usage };
  }

  async *generateStream(messages: ChatMessage[], options?: { signal?: AbortSignal }) {
    const payload = {
      model: this.model,
      messages,
      stream: true,
    };

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal: options?.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`openai-compatible http ${res.status}: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return;

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

        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice('data:'.length).trimStart());
          }
        }

        if (dataLines.length === 0) continue;
        const dataStr = dataLines.join('\n').trim();

        if (dataStr === '[DONE]') return;

        let payloadJson: unknown;
        try {
          payloadJson = JSON.parse(dataStr);
        } catch {
          continue;
        }

        type ChatStreamPayload = {
          choices?: Array<{
            delta?: { content?: unknown };
            message?: { content?: unknown };
            text?: unknown;
          }>;
        };

        const payload = payloadJson as ChatStreamPayload;
        const choice0 = payload.choices?.[0];
        const delta =
          choice0?.delta?.content ??
          choice0?.message?.content ??
          choice0?.text ??
          '';

        if (typeof delta === 'string' && delta.length > 0) {
          yield delta;
        }
      }
    }
  }
}
