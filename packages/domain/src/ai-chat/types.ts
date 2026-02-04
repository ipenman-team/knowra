export type AiMessageRole = 'SYSTEM' | 'USER' | 'ASSISTANT';

export type AiConversation = {
  id: string;
  tenantId: string;
  title: string;

  internetEnabled: boolean;
  spaceEnabled: boolean;
  /**
   * Empty array means search all spaces.
   */
  spaceIds: string[];

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AiMessage = {
  id: string;
  tenantId: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  model?: string | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
