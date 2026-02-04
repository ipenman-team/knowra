export type AiMessageRole = 'SYSTEM' | 'USER' | 'ASSISTANT';

export type AiConversationDataSource = {
  internetEnabled: boolean;
  spaceEnabled: boolean;
  /**
   * Empty array means search all spaces.
   */
  spaceIds: string[];
  /**
   * When disabled, prompt context only includes the current query.
   */
  carryContext: boolean;
} & Record<string, unknown>;

export type AiConversation = {
  id: string;
  tenantId: string;
  title: string;

  dataSource: AiConversationDataSource;

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
