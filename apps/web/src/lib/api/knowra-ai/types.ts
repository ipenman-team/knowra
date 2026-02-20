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

export type AiConversationSourcesDto = {
  internetEnabled: boolean;
  spaceEnabled: boolean;
  spaceIds: string[];
  carryContext: boolean;
};

export type AiAttachmentDto = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
};

export type AiAttachmentUploadResult = {
  ok: true;
  attachments: AiAttachmentDto[];
};

export type InlineAiActionType =
  | 'rewrite'
  | 'condense'
  | 'expand'
  | 'summarize'
  | 'translate'
  | 'qa'
  | 'custom';
