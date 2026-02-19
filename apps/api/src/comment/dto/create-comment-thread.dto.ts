export type CreateCommentThreadDto = {
  pageId?: string;
  spaceId?: string;
  content?: unknown;
  quoteText?: string | null;
  anchorType?: string | null;
  anchorPayload?: unknown | null;
  password?: string | null;
  guestId?: string | null;
  guestProfile?: {
    nickname?: string | null;
    email?: string | null;
  } | null;
};
