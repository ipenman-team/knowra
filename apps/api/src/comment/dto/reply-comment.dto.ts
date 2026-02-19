export type ReplyCommentDto = {
  content?: unknown;
  parentId?: string | null;
  replyToMessageId?: string | null;
  password?: string | null;
  guestId?: string | null;
};
