import {
  CreateCommentThreadUseCase,
  ModerateCommentContentUseCase,
  ReplyCommentThreadUseCase,
} from '../../../../../../packages/application/src/comment';
import type {
  CommentCreateResult,
  CommentModerationLogRepository,
  CommentRepository,
  CommentThread,
  CommentMessage,
  CreateCommentModerationLogParams,
  CreateCommentThreadWithMessageParams,
  ListCommentMessagesParams,
  ListCommentMessagesResult,
  ListCommentThreadsParams,
  ListCommentThreadsResult,
  ReplyCommentThreadWithMessageParams,
  ResolveCommentThreadParams,
} from '../../../../../../packages/domain/src/comment';

function makeRepo(): CommentRepository {
  const threads: CommentThread[] = [];
  const messages: CommentMessage[] = [];

  return {
    async createThreadWithMessage(
      params: CreateCommentThreadWithMessageParams,
    ): Promise<CommentCreateResult> {
      const now = new Date();
      const thread: CommentThread = {
        id: `ct_${threads.length + 1}`,
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        pageId: params.pageId,
        shareId: params.shareId ?? null,
        source: params.source,
        status: 'OPEN',
        quoteText: params.quoteText ?? null,
        anchorType: params.anchorType ?? null,
        anchorPayload: params.anchorPayload ?? null,
        messageCount: 1,
        participantCount: 1,
        lastMessageId: null,
        lastMessageAt: now,
        lastActorType: params.authorType,
        lastActorUserId: params.authorUserId ?? null,
        lastActorGuestId: params.authorGuestId ?? null,
        resolvedAt: null,
        resolvedBy: null,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const message: CommentMessage = {
        id: `cm_${messages.length + 1}`,
        tenantId: params.tenantId,
        threadId: thread.id,
        parentId: null,
        replyToMessageId: null,
        authorType: params.authorType,
        authorUserId: params.authorUserId ?? null,
        authorGuestId: params.authorGuestId ?? null,
        content: params.content,
        contentText: params.contentText,
        moderationStatus: params.moderationStatus ?? 'PASS',
        riskCategories: params.riskCategories ?? null,
        riskScore: params.riskScore ?? null,
        isVisible: true,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      thread.lastMessageId = message.id;
      thread.lastMessageAt = message.createdAt;

      threads.push(thread);
      messages.push(message);

      return {
        thread,
        message,
      };
    },

    async replyThreadWithMessage(
      params: ReplyCommentThreadWithMessageParams,
    ): Promise<CommentCreateResult> {
      const thread = threads.find(
        (item) =>
          item.id === params.threadId &&
          item.tenantId === params.tenantId &&
          !item.isDeleted,
      );
      if (!thread) throw new Error('thread not found');

      const now = new Date();
      const message: CommentMessage = {
        id: `cm_${messages.length + 1}`,
        tenantId: params.tenantId,
        threadId: params.threadId,
        parentId: params.parentId ?? null,
        replyToMessageId: params.replyToMessageId ?? null,
        authorType: params.authorType,
        authorUserId: params.authorUserId ?? null,
        authorGuestId: params.authorGuestId ?? null,
        content: params.content,
        contentText: params.contentText,
        moderationStatus: params.moderationStatus ?? 'PASS',
        riskCategories: params.riskCategories ?? null,
        riskScore: params.riskScore ?? null,
        isVisible: true,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      messages.push(message);

      thread.messageCount += 1;
      thread.lastMessageId = message.id;
      thread.lastMessageAt = message.createdAt;
      thread.updatedBy = params.actorUserId;
      thread.updatedAt = now;

      return {
        thread,
        message,
      };
    },

    async getThreadById(params: {
      tenantId: string;
      threadId: string;
    }): Promise<CommentThread | null> {
      return (
        threads.find(
          (item) =>
            item.id === params.threadId &&
            item.tenantId === params.tenantId &&
            !item.isDeleted,
        ) ?? null
      );
    },

    async listThreads(
      params: ListCommentThreadsParams,
    ): Promise<ListCommentThreadsResult> {
      void params;
      return { items: [], hasMore: false, nextCursor: null };
    },

    async listMessages(
      params: ListCommentMessagesParams,
    ): Promise<ListCommentMessagesResult> {
      void params;
      return { items: [], hasMore: false, nextCursor: null };
    },

    async countThreadSummary(params: {
      tenantId: string;
      pageId: string;
      shareId?: string | null;
    }) {
      void params;
      return { all: 0, internal: 0, external: 0, open: 0, resolved: 0 };
    },

    async resolveThread(params: ResolveCommentThreadParams): Promise<CommentThread> {
      const thread = threads.find(
        (item) =>
          item.id === params.threadId &&
          item.tenantId === params.tenantId &&
          !item.isDeleted,
      );
      if (!thread) throw new Error('thread not found');
      thread.status = params.status;
      return thread;
    },
  };
}

function makeModerationLogRepo(buffer: CreateCommentModerationLogParams[]) {
  const repo: CommentModerationLogRepository = {
    async create(params: CreateCommentModerationLogParams): Promise<void> {
      buffer.push(params);
    },
  };

  return repo;
}

describe('Comment usecases', () => {
  test('creates thread when moderation PASS', async () => {
    const moderationLogs: CreateCommentModerationLogParams[] = [];
    const useCase = new CreateCommentThreadUseCase(
      makeRepo(),
      makeModerationLogRepo(moderationLogs),
      new ModerateCommentContentUseCase(),
    );

    const res = await useCase.create({
      tenantId: 't1',
      spaceId: 's1',
      pageId: 'p1',
      source: 'INTERNAL',
      content: { text: '正常内容' },
      authorType: 'MEMBER',
      authorUserId: 'u1',
      actorUserId: 'u1',
    });

    expect(res.kind).toBe('created');
    expect(moderationLogs).toHaveLength(0);
  });

  test('blocks thread when moderation REJECT', async () => {
    const moderationLogs: CreateCommentModerationLogParams[] = [];
    const useCase = new CreateCommentThreadUseCase(
      makeRepo(),
      makeModerationLogRepo(moderationLogs),
      new ModerateCommentContentUseCase(),
    );

    const res = await useCase.create({
      tenantId: 't1',
      spaceId: 's1',
      pageId: 'p1',
      source: 'INTERNAL',
      content: { text: 'fuck this' },
      authorType: 'MEMBER',
      authorUserId: 'u1',
      actorUserId: 'u1',
    });

    expect(res.kind).toBe('moderated');
    expect(res.moderation.status).toBe('REJECT');
    expect(moderationLogs).toHaveLength(1);
  });

  test('replies to existing thread', async () => {
    const moderationLogs: CreateCommentModerationLogParams[] = [];
    const repo = makeRepo();
    const createUseCase = new CreateCommentThreadUseCase(
      repo,
      makeModerationLogRepo(moderationLogs),
      new ModerateCommentContentUseCase(),
    );
    const replyUseCase = new ReplyCommentThreadUseCase(
      repo,
      makeModerationLogRepo(moderationLogs),
      new ModerateCommentContentUseCase(),
    );

    const created = await createUseCase.create({
      tenantId: 't1',
      spaceId: 's1',
      pageId: 'p1',
      source: 'INTERNAL',
      content: { text: '第一条' },
      authorType: 'MEMBER',
      authorUserId: 'u1',
      actorUserId: 'u1',
    });

    if (created.kind !== 'created') {
      throw new Error('expected created');
    }

    const replied = await replyUseCase.reply({
      tenantId: 't1',
      threadId: created.data.thread.id,
      content: { text: '第二条' },
      authorType: 'MEMBER',
      authorUserId: 'u2',
      actorUserId: 'u2',
    });

    expect(replied.kind).toBe('created');
    if (replied.kind === 'created') {
      expect(replied.data.thread.messageCount).toBe(2);
    }
  });
});
