import type {
  CommentThread,
  CommentMessage,
  CommentThreadCounts,
  CreateCommentThreadWithMessageParams,
  ReplyCommentThreadWithMessageParams,
  ListCommentThreadsParams,
  ListCommentThreadsResult,
  ListCommentMessagesParams,
  ListCommentMessagesResult,
  ResolveCommentThreadParams,
} from '../types';

export type CommentCreateResult = {
  thread: CommentThread;
  message: CommentMessage;
};

export interface CommentRepository {
  createThreadWithMessage(
    params: CreateCommentThreadWithMessageParams,
  ): Promise<CommentCreateResult>;

  replyThreadWithMessage(
    params: ReplyCommentThreadWithMessageParams,
  ): Promise<CommentCreateResult>;

  getThreadById(params: {
    tenantId: string;
    threadId: string;
  }): Promise<CommentThread | null>;

  listThreads(params: ListCommentThreadsParams): Promise<ListCommentThreadsResult>;

  listMessages(
    params: ListCommentMessagesParams,
  ): Promise<ListCommentMessagesResult>;

  countThreadSummary(params: {
    tenantId: string;
    pageId: string;
    shareId?: string | null;
  }): Promise<CommentThreadCounts>;

  resolveThread(params: ResolveCommentThreadParams): Promise<CommentThread>;
}
