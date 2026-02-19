export type CommentSource = 'INTERNAL' | 'EXTERNAL';

export type CommentThreadStatus = 'OPEN' | 'RESOLVED' | 'ARCHIVED';

export type CommentAuthorType =
  | 'MEMBER'
  | 'COLLABORATOR'
  | 'REGISTERED_EXTERNAL'
  | 'GUEST_EXTERNAL';

export type CommentModerationStatus = 'PASS' | 'REVIEW' | 'REJECT';

export type CommentRiskCategory =
  | 'PROFANITY'
  | 'POLITICS'
  | 'PORN'
  | 'GAMBLING'
  | 'DRUGS'
  | 'OTHER';

export type CommentThread = {
  id: string;
  tenantId: string;
  spaceId: string;
  pageId: string;
  shareId?: string | null;
  source: CommentSource;
  status: CommentThreadStatus;
  quoteText?: string | null;
  anchorType?: string | null;
  anchorPayload?: unknown | null;
  messageCount: number;
  participantCount: number;
  lastMessageId?: string | null;
  lastMessageAt?: Date | null;
  lastActorType?: CommentAuthorType | null;
  lastActorUserId?: string | null;
  lastActorGuestId?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CommentMessage = {
  id: string;
  tenantId: string;
  threadId: string;
  parentId?: string | null;
  replyToMessageId?: string | null;
  authorType: CommentAuthorType;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  authorGuestNickname?: string | null;
  content: unknown;
  contentText: string;
  moderationStatus: CommentModerationStatus;
  riskCategories?: CommentRiskCategory[] | null;
  riskScore?: number | null;
  isVisible: boolean;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CommentMessagePreview = {
  id: string;
  contentText: string;
  createdAt: Date;
  authorType: CommentAuthorType;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  authorGuestNickname?: string | null;
};

export type CommentThreadSummary = {
  thread: CommentThread;
  rootMessage?: CommentMessagePreview | null;
  latestMessage?: CommentMessagePreview | null;
};

export type CommentThreadCounts = {
  all: number;
  internal: number;
  external: number;
  open: number;
  resolved: number;
};

export type ListCommentThreadsParams = {
  tenantId: string;
  pageId: string;
  shareId?: string | null;
  source?: CommentSource | null;
  status?: CommentThreadStatus | null;
  cursor?: string | null;
  limit?: number | null;
};

export type ListCommentThreadsResult = {
  items: CommentThreadSummary[];
  nextCursor?: string | null;
  hasMore: boolean;
};

export type ListCommentMessagesParams = {
  tenantId: string;
  threadId: string;
  cursor?: string | null;
  limit?: number | null;
  order?: 'asc' | 'desc' | null;
};

export type ListCommentMessagesResult = {
  items: CommentMessage[];
  nextCursor?: string | null;
  hasMore: boolean;
};

export type CreateCommentThreadWithMessageParams = {
  tenantId: string;
  spaceId: string;
  pageId: string;
  shareId?: string | null;
  source: CommentSource;
  quoteText?: string | null;
  anchorType?: string | null;
  anchorPayload?: unknown | null;
  authorType: CommentAuthorType;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  authorGuestNickname?: string | null;
  authorGuestEmail?: string | null;
  content: unknown;
  contentText: string;
  moderationStatus?: CommentModerationStatus | null;
  riskCategories?: CommentRiskCategory[] | null;
  riskScore?: number | null;
  actorUserId: string;
};

export type ReplyCommentThreadWithMessageParams = {
  tenantId: string;
  threadId: string;
  parentId?: string | null;
  replyToMessageId?: string | null;
  authorType: CommentAuthorType;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  authorGuestNickname?: string | null;
  authorGuestEmail?: string | null;
  content: unknown;
  contentText: string;
  moderationStatus?: CommentModerationStatus | null;
  riskCategories?: CommentRiskCategory[] | null;
  riskScore?: number | null;
  actorUserId: string;
};

export type ResolveCommentThreadParams = {
  tenantId: string;
  threadId: string;
  status: Extract<CommentThreadStatus, 'OPEN' | 'RESOLVED'>;
  actorUserId: string;
};

export type CreateCommentModerationLogParams = {
  tenantId: string;
  pageId: string;
  threadId?: string | null;
  messageId?: string | null;
  actorType?: CommentAuthorType | null;
  actorUserId?: string | null;
  actorGuestId?: string | null;
  inputTextHash: string;
  result: CommentModerationStatus;
  hitCategories?: CommentRiskCategory[] | null;
  hitTerms?: string[] | null;
  policyVersion?: string | null;
  actorId: string;
};

export type ModerateCommentContentInput = {
  text: string;
};

export type ModerateCommentContentResult = {
  status: CommentModerationStatus;
  riskCategories: CommentRiskCategory[];
  riskScore: number;
  hitTerms: string[];
  policyVersion: string;
};
