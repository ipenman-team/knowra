export type ContextaAiMessage = { role: 'user' | 'assistant'; content: string };

export type ContextaAiConversation = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  draft: string;
  messages: ContextaAiMessage[];
};
