export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatStreamOptions = {
  signal?: AbortSignal;
};

export interface ChatProvider {
  model: string;
  generate(messages: ChatMessage[]): Promise<{ content: string; usage?: unknown }>;

  // Optional streaming generation. When provided, yields incremental content deltas.
  generateStream?(messages: ChatMessage[], options?: ChatStreamOptions): AsyncIterable<string>;
}
