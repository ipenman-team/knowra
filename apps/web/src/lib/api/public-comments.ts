import { publicApiClient } from './public-client';
import type {
  CommentMessageDto,
  CommentModerationResponse,
  CommentSource,
  CommentThreadStatus,
  ListCommentMessagesResponse,
  ListCommentThreadsResponse,
} from './comments';

export type PublicCommentAgreement = {
  title: string;
  version: string;
  updatedAt: string;
  contentMarkdown: string;
};

export const publicCommentsApi = {
  listThreads: async (
    publicId: string,
    params: {
      pageId: string;
      status?: 'ALL' | CommentThreadStatus;
      cursor?: string;
      limit?: number;
      password?: string;
      source?: 'ALL' | CommentSource;
    },
  ): Promise<ListCommentThreadsResponse> => {
    const res = await publicApiClient.get<ListCommentThreadsResponse>(
      `/public/shares/${publicId}/comments`,
      { params },
    );
    return res.data;
  },

  summary: async (
    publicId: string,
    params: { pageId: string; password?: string },
  ): Promise<{
    all: number;
    internal: number;
    external: number;
    open: number;
    resolved: number;
  }> => {
    const res = await publicApiClient.get<{
      all: number;
      internal: number;
      external: number;
      open: number;
      resolved: number;
    }>(`/public/shares/${publicId}/comments/summary`, {
      params,
    });

    return res.data;
  },

  agreement: async (
    publicId: string,
    params?: { password?: string },
  ): Promise<PublicCommentAgreement> => {
    const res = await publicApiClient.get<PublicCommentAgreement>(
      `/public/shares/${publicId}/comments/agreement`,
      { params },
    );
    return res.data;
  },

  listMessages: async (
    publicId: string,
    threadId: string,
    params?: {
      cursor?: string;
      limit?: number;
      order?: 'asc' | 'desc';
      password?: string;
      pageId?: string;
    },
  ): Promise<ListCommentMessagesResponse> => {
    const res = await publicApiClient.get<ListCommentMessagesResponse>(
      `/public/shares/${publicId}/comments/threads/${threadId}/messages`,
      { params },
    );
    return res.data;
  },

  createThread: async (
    publicId: string,
    payload: {
      pageId: string;
      content: { text: string; slate?: unknown };
      quoteText?: string;
      anchorType?: string;
      anchorPayload?: unknown;
      password?: string;
      guestId?: string;
      guestProfile?: {
        nickname?: string;
        email?: string;
      };
    },
  ): Promise<CommentModerationResponse> => {
    const res = await publicApiClient.post<CommentModerationResponse>(
      `/public/shares/${publicId}/comments/threads`,
      payload,
    );
    return res.data;
  },

  replyThread: async (
    publicId: string,
    threadId: string,
    payload: {
      content: { text: string; slate?: unknown };
      parentId?: string;
      replyToMessageId?: string;
      password?: string;
      guestId?: string;
      guestProfile?: {
        nickname?: string;
        email?: string;
      };
    },
  ): Promise<CommentModerationResponse> => {
    const res = await publicApiClient.post<CommentModerationResponse>(
      `/public/shares/${publicId}/comments/threads/${threadId}/replies`,
      payload,
    );
    return res.data;
  },
};

export type { CommentMessageDto };
