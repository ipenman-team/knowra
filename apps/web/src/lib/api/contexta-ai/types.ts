export type AiConversationDto = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AiMessageDto = {
  id: string;
  role: 'SYSTEM' | 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};
