export type AiChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiChatStreamOptions = {
  signal?: AbortSignal;
};

export interface AiChatProvider {
  model: string;

  generate(messages: AiChatMessage[]): Promise<{ content: string; usage?: unknown }>;

  generateStream?(
    messages: AiChatMessage[],
    options?: AiChatStreamOptions,
  ): AsyncIterable<string>;
}
