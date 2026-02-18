export type ReplyCommentDto = {
  content?: unknown;
  parentId?: string | null;
  replyToMessageId?: string | null;
  password?: string | null;
};
