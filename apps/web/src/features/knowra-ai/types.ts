export type KnowraAiMessage = { role: 'user' | 'assistant'; content: string };

export type KnowraAiConversation = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  draft: string;
  messages: KnowraAiMessage[];
};
