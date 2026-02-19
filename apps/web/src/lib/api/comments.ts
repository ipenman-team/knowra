import { apiClient } from './client';

export type CommentSource = 'INTERNAL' | 'EXTERNAL';
export type CommentThreadStatus = 'OPEN' | 'RESOLVED' | 'ARCHIVED';
export type CommentModerationStatus = 'PASS' | 'REVIEW' | 'REJECT';

export type CommentThreadDto = {
  id: string;
  tenantId: string;
  spaceId: string;
  pageId: string;
  shareId?: string | null;
  source: CommentSource;
  status: CommentThreadStatus;
  quoteText?: string | null;
  messageCount: number;
  participantCount: number;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommentMessageDto = {
  id: string;
  tenantId: string;
  threadId: string;
  parentId?: string | null;
  replyToMessageId?: string | null;
  authorType: string;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  content: unknown;
  contentText: string;
  moderationStatus: CommentModerationStatus;
  riskCategories?: string[] | null;
  riskScore?: number | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentThreadSummaryDto = {
  thread: CommentThreadDto;
  latestMessage?: {
    id: string;
    contentText: string;
    createdAt: string;
    authorType: string;
    authorUserId?: string | null;
    authorGuestId?: string | null;
  } | null;
};

export type ListCommentThreadsResponse = {
  items: CommentThreadSummaryDto[];
  hasMore: boolean;
  nextCursor?: string | null;
};

export type ListCommentMessagesResponse = {
  items: CommentMessageDto[];
  hasMore: boolean;
  nextCursor?: string | null;
};

export type CommentModerationResponse = {
  moderation: {
    status: CommentModerationStatus;
    riskCategories?: string[];
  };
  thread?: CommentThreadDto;
  message?: CommentMessageDto;
};

export const commentsApi = {
  listThreads: async (params: {
    pageId: string;
    source?: 'ALL' | CommentSource;
    status?: 'ALL' | CommentThreadStatus;
    cursor?: string;
    limit?: number;
  }): Promise<ListCommentThreadsResponse> => {
    const res = await apiClient.get<ListCommentThreadsResponse>('/comments/threads', {
      params,
    });
    return res.data;
  },

  summary: async (pageId: string) => {
    const res = await apiClient.get<{
      all: number;
      internal: number;
      external: number;
      open: number;
      resolved: number;
    }>('/comments/threads/summary', {
      params: { pageId },
    });
    return res.data;
  },

  listMessages: async (
    threadId: string,
    params?: { cursor?: string; limit?: number; order?: 'asc' | 'desc' },
  ): Promise<ListCommentMessagesResponse> => {
    const res = await apiClient.get<ListCommentMessagesResponse>(
      `/comments/threads/${threadId}/messages`,
      { params },
    );
    return res.data;
  },

  createThread: async (payload: {
    pageId: string;
    spaceId: string;
    content: { text: string; slate?: unknown };
    quoteText?: string;
    anchorType?: string;
    anchorPayload?: unknown;
  }): Promise<CommentModerationResponse> => {
    const res = await apiClient.post<CommentModerationResponse>('/comments/threads', payload);
    return res.data;
  },

  replyThread: async (
    threadId: string,
    payload: {
      content: { text: string; slate?: unknown };
      parentId?: string;
      replyToMessageId?: string;
    },
  ): Promise<CommentModerationResponse> => {
    const res = await apiClient.post<CommentModerationResponse>(
      `/comments/threads/${threadId}/replies`,
      payload,
    );
    return res.data;
  },

  updateThreadStatus: async (threadId: string, status: 'OPEN' | 'RESOLVED') => {
    const res = await apiClient.post<CommentThreadDto>(`/comments/threads/${threadId}/status`, {
      status,
    });
    return res.data;
  },
};
