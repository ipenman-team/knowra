export type ReplyCommentDto = {
  content?: unknown;
  parentId?: string | null;
  replyToMessageId?: string | null;
  password?: string | null;
  guestId?: string | null;
  guestProfile?: {
    nickname?: string | null;
    email?: string | null;
  } | null;
};
