import type {
  CommentCreateResult,
  CommentMessage,
  CommentMessagePreview,
  CommentRepository,
  CommentRiskCategory,
  CommentThread,
  CommentThreadCounts,
  CreateCommentThreadWithMessageParams,
  ListCommentMessagesParams,
  ListCommentMessagesResult,
  ListCommentThreadsParams,
  ListCommentThreadsResult,
  ReplyCommentThreadWithMessageParams,
  ResolveCommentThreadParams,
} from '@contexta/domain';
import {
  decodeCommentMessageCursor,
  decodeCommentThreadCursor,
  encodeCommentMessageCursor,
  encodeCommentThreadCursor,
} from '@contexta/domain';
import type { Prisma, PrismaClient } from '@prisma/client';

function toRiskCategories(value: Prisma.JsonValue | null): CommentRiskCategory[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.filter((item): item is CommentRiskCategory => typeof item === 'string');
  return out.length > 0 ? out : null;
}

function toThread(row: {
  id: string;
  tenantId: string;
  spaceId: string;
  pageId: string;
  shareId: string | null;
  source: string;
  status: string;
  quoteText: string | null;
  anchorType: string | null;
  anchorPayload: Prisma.JsonValue | null;
  messageCount: number;
  participantCount: number;
  lastMessageId: string | null;
  lastMessageAt: Date | null;
  lastActorType: string | null;
  lastActorUserId: string | null;
  lastActorGuestId: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CommentThread {
  return {
    id: row.id,
    tenantId: row.tenantId,
    spaceId: row.spaceId,
    pageId: row.pageId,
    shareId: row.shareId,
    source: row.source as CommentThread['source'],
    status: row.status as CommentThread['status'],
    quoteText: row.quoteText,
    anchorType: row.anchorType,
    anchorPayload: row.anchorPayload,
    messageCount: row.messageCount,
    participantCount: row.participantCount,
    lastMessageId: row.lastMessageId,
    lastMessageAt: row.lastMessageAt,
    lastActorType: row.lastActorType as CommentThread['lastActorType'],
    lastActorUserId: row.lastActorUserId,
    lastActorGuestId: row.lastActorGuestId,
    resolvedAt: row.resolvedAt,
    resolvedBy: row.resolvedBy,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toMessage(row: {
  id: string;
  tenantId: string;
  threadId: string;
  parentId: string | null;
  replyToMessageId: string | null;
  authorType: string;
  authorUserId: string | null;
  authorGuestId: string | null;
  authorGuestNickname: string | null;
  content: Prisma.JsonValue;
  contentText: string;
  moderationStatus: string;
  riskCategories: Prisma.JsonValue | null;
  riskScore: number | null;
  isVisible: boolean;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CommentMessage {
  return {
    id: row.id,
    tenantId: row.tenantId,
    threadId: row.threadId,
    parentId: row.parentId,
    replyToMessageId: row.replyToMessageId,
    authorType: row.authorType as CommentMessage['authorType'],
    authorUserId: row.authorUserId,
    authorGuestId: row.authorGuestId,
    authorGuestNickname: row.authorGuestNickname,
    content: row.content,
    contentText: row.contentText,
    moderationStatus: row.moderationStatus as CommentMessage['moderationStatus'],
    riskCategories: toRiskCategories(row.riskCategories),
    riskScore: row.riskScore,
    isVisible: row.isVisible,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPreview(message: CommentMessage | null): CommentMessagePreview | null {
  if (!message) return null;
  return {
    id: message.id,
    contentText: message.contentText,
    createdAt: message.createdAt,
    authorType: message.authorType,
    authorUserId: message.authorUserId,
    authorGuestId: message.authorGuestId,
    authorGuestNickname: message.authorGuestNickname,
  };
}

function normalizeGuestNickname(value?: string | null, fallbackGuestId?: string | null): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text) {
    return text.length > 30 ? text.slice(0, 30) : text;
  }
  const suffix = (fallbackGuestId ?? '').slice(-4).toUpperCase() || 'GUEST';
  return `访客-${suffix}`;
}

function normalizeGuestEmail(value?: string | null): string | null {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return text || null;
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  if (!('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function isIgnorableGuestProfilePersistenceError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code === 'P2021' || code === 'P2022') {
    return true;
  }

  const message = error instanceof Error ? error.message : '';
  return (
    message.includes('comment_guest_profiles') ||
    message.includes('commentGuestProfile')
  );
}

async function upsertGuestProfile(params: {
  tx: Prisma.TransactionClient;
  tenantId: string;
  shareId?: string | null;
  guestId?: string | null;
  nickname?: string | null;
  email?: string | null;
  actorUserId: string;
}) {
  if (!params.shareId || !params.guestId) return;

  const nickname = normalizeGuestNickname(params.nickname, params.guestId);
  const email = normalizeGuestEmail(params.email);

  const delegate = (
    params.tx as unknown as {
      commentGuestProfile?: {
        upsert?: (args: unknown) => Promise<unknown>;
      };
    }
  ).commentGuestProfile;
  if (!delegate?.upsert) return;

  try {
    await delegate.upsert({
      where: {
        tenantId_shareId_guestId: {
          tenantId: params.tenantId,
          shareId: params.shareId,
          guestId: params.guestId,
        },
      },
      create: {
        tenantId: params.tenantId,
        shareId: params.shareId,
        guestId: params.guestId,
        nickname,
        email,
        lastSeenAt: new Date(),
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
      update: {
        nickname,
        email: email ?? undefined,
        lastSeenAt: new Date(),
        updatedBy: params.actorUserId,
      },
    });
  } catch (error) {
    // Keep comment creation available during rolling upgrade if guest profile table/column is not ready.
    if (isIgnorableGuestProfilePersistenceError(error)) return;
    throw error;
  }
}

export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createThreadWithMessage(
    params: CreateCommentThreadWithMessageParams,
  ): Promise<CommentCreateResult> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const thread = await tx.commentThread.create({
        data: {
          tenantId: params.tenantId,
          spaceId: params.spaceId,
          pageId: params.pageId,
          shareId: params.shareId ?? null,
          source: params.source,
          status: 'OPEN',
          quoteText: params.quoteText ?? null,
          anchorType: params.anchorType ?? null,
          anchorPayload:
            params.anchorPayload == null
              ? undefined
              : (params.anchorPayload as Prisma.InputJsonValue),
          messageCount: 1,
          participantCount: 1,
          lastMessageAt: now,
          lastActorType: params.authorType,
          lastActorUserId: params.authorUserId ?? null,
          lastActorGuestId: params.authorGuestId ?? null,
          createdBy: params.actorUserId,
          updatedBy: params.actorUserId,
        },
      });

      const message = await tx.commentMessage.create({
        data: {
          tenantId: params.tenantId,
          threadId: thread.id,
          authorType: params.authorType,
          authorUserId: params.authorUserId ?? null,
          authorGuestId: params.authorGuestId ?? null,
          authorGuestNickname:
            params.authorGuestId == null
              ? null
              : normalizeGuestNickname(params.authorGuestNickname, params.authorGuestId),
          content: params.content as Prisma.InputJsonValue,
          contentText: params.contentText,
          moderationStatus: params.moderationStatus ?? 'PASS',
          riskCategories:
            params.riskCategories == null
              ? undefined
              : (params.riskCategories as Prisma.InputJsonValue),
          riskScore: params.riskScore ?? null,
          isVisible: true,
          createdBy: params.actorUserId,
          updatedBy: params.actorUserId,
        },
      });

      await upsertGuestProfile({
        tx,
        tenantId: params.tenantId,
        shareId: params.shareId ?? null,
        guestId: params.authorGuestId ?? null,
        nickname: params.authorGuestNickname ?? null,
        email: params.authorGuestEmail ?? null,
        actorUserId: params.actorUserId,
      });

      const updatedThread = await tx.commentThread.update({
        where: { id: thread.id },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          updatedBy: params.actorUserId,
        },
      });

      return {
        thread: toThread(updatedThread),
        message: toMessage(message),
      };
    });
  }

  async replyThreadWithMessage(
    params: ReplyCommentThreadWithMessageParams,
  ): Promise<CommentCreateResult> {
    return this.prisma.$transaction(async (tx) => {
      const thread = await tx.commentThread.findFirst({
        where: {
          id: params.threadId,
          tenantId: params.tenantId,
          isDeleted: false,
        },
      });
      if (!thread) throw new Error('thread not found');

      if (thread.status === 'ARCHIVED') {
        throw new Error('thread archived');
      }

      let participantExists = false;
      if (params.authorUserId) {
        participantExists = Boolean(
          await tx.commentMessage.findFirst({
            where: {
              tenantId: params.tenantId,
              threadId: params.threadId,
              isDeleted: false,
              authorUserId: params.authorUserId,
            },
            select: { id: true },
          }),
        );
      } else if (params.authorGuestId) {
        participantExists = Boolean(
          await tx.commentMessage.findFirst({
            where: {
              tenantId: params.tenantId,
              threadId: params.threadId,
              isDeleted: false,
              authorGuestId: params.authorGuestId,
            },
            select: { id: true },
          }),
        );
      }

      const message = await tx.commentMessage.create({
        data: {
          tenantId: params.tenantId,
          threadId: params.threadId,
          parentId: params.parentId ?? null,
          replyToMessageId: params.replyToMessageId ?? null,
          authorType: params.authorType,
          authorUserId: params.authorUserId ?? null,
          authorGuestId: params.authorGuestId ?? null,
          authorGuestNickname:
            params.authorGuestId == null
              ? null
              : normalizeGuestNickname(params.authorGuestNickname, params.authorGuestId),
          content: params.content as Prisma.InputJsonValue,
          contentText: params.contentText,
          moderationStatus: params.moderationStatus ?? 'PASS',
          riskCategories:
            params.riskCategories == null
              ? undefined
              : (params.riskCategories as Prisma.InputJsonValue),
          riskScore: params.riskScore ?? null,
          isVisible: true,
          createdBy: params.actorUserId,
          updatedBy: params.actorUserId,
        },
      });

      await upsertGuestProfile({
        tx,
        tenantId: params.tenantId,
        shareId: thread.shareId,
        guestId: params.authorGuestId ?? null,
        nickname: params.authorGuestNickname ?? null,
        email: params.authorGuestEmail ?? null,
        actorUserId: params.actorUserId,
      });

      const updatedThread = await tx.commentThread.update({
        where: { id: params.threadId },
        data: {
          messageCount: { increment: 1 },
          participantCount: participantExists ? undefined : { increment: 1 },
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          lastActorType: params.authorType,
          lastActorUserId: params.authorUserId ?? null,
          lastActorGuestId: params.authorGuestId ?? null,
          updatedBy: params.actorUserId,
        },
      });

      return {
        thread: toThread(updatedThread),
        message: toMessage(message),
      };
    });
  }

  async getThreadById(params: {
    tenantId: string;
    threadId: string;
  }): Promise<CommentThread | null> {
    const row = await this.prisma.commentThread.findFirst({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
    });

    return row ? toThread(row) : null;
  }

  async listThreads(
    params: ListCommentThreadsParams,
  ): Promise<ListCommentThreadsResult> {
    const limit = Math.min(Math.max(Number(params.limit ?? 20), 1), 50);
    const take = limit + 1;

    const where: Prisma.CommentThreadWhereInput = {
      tenantId: params.tenantId,
      pageId: params.pageId,
      shareId: params.shareId ?? undefined,
      source: params.source ?? undefined,
      status: params.status ?? undefined,
      isDeleted: false,
      messageCount: { gt: 0 },
    };

    const decoded = params.cursor ? decodeCommentThreadCursor(params.cursor) : null;
    if (decoded) {
      where.OR = [
        { lastMessageAt: { lt: decoded.lastMessageAt } },
        { lastMessageAt: decoded.lastMessageAt, id: { lt: decoded.id } },
      ];
    }

    const rows = await this.prisma.commentThread.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      include: {
        messages: {
          where: { isDeleted: false, isVisible: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 1,
        },
      },
      take,
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const latestMessageIds = [
      ...new Set(
        sliced
          .map((row) => row.lastMessageId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    ];
    const latestMessageMap = new Map<string, CommentMessage>();

    if (latestMessageIds.length > 0) {
      const latestRows = await this.prisma.commentMessage.findMany({
        where: {
          tenantId: params.tenantId,
          id: { in: latestMessageIds },
          isDeleted: false,
          isVisible: true,
        },
      });

      for (const row of latestRows) {
        latestMessageMap.set(row.id, toMessage(row));
      }
    }

    const items = sliced.map((row) => {
      const root = row.messages[0] ? toMessage(row.messages[0]) : null;
      const latest = row.lastMessageId ? latestMessageMap.get(row.lastMessageId) ?? null : null;
      return {
        thread: toThread(row),
        rootMessage: toPreview(root),
        latestMessage: toPreview(latest),
      };
    });

    const last = items.at(-1)?.thread;

    return {
      items,
      hasMore,
      nextCursor:
        hasMore && last?.lastMessageAt
          ? encodeCommentThreadCursor({ lastMessageAt: last.lastMessageAt, id: last.id })
          : null,
    };
  }

  async listMessages(
    params: ListCommentMessagesParams,
  ): Promise<ListCommentMessagesResult> {
    const limit = Math.min(Math.max(Number(params.limit ?? 30), 1), 100);
    const take = limit + 1;
    const order = params.order === 'desc' ? 'desc' : 'asc';

    const where: Prisma.CommentMessageWhereInput = {
      tenantId: params.tenantId,
      threadId: params.threadId,
      isDeleted: false,
      isVisible: true,
    };

    const decoded = params.cursor ? decodeCommentMessageCursor(params.cursor) : null;
    if (decoded) {
      if (order === 'asc') {
        where.OR = [
          { createdAt: { gt: decoded.createdAt } },
          { createdAt: decoded.createdAt, id: { gt: decoded.id } },
        ];
      } else {
        where.OR = [
          { createdAt: { lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        ];
      }
    }

    const rows = await this.prisma.commentMessage.findMany({
      where,
      orderBy: [{ createdAt: order }, { id: order }],
      take,
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const items = sliced.map(toMessage);
    const last = items.at(-1);

    return {
      items,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCommentMessageCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  async countThreadSummary(params: {
    tenantId: string;
    pageId: string;
    shareId?: string | null;
  }): Promise<CommentThreadCounts> {
    const baseWhere: Prisma.CommentThreadWhereInput = {
      tenantId: params.tenantId,
      pageId: params.pageId,
      shareId: params.shareId ?? undefined,
      isDeleted: false,
      messageCount: { gt: 0 },
    };

    const [all, internal, external, open, resolved] = await this.prisma.$transaction([
      this.prisma.commentThread.count({ where: baseWhere }),
      this.prisma.commentThread.count({
        where: { ...baseWhere, source: 'INTERNAL' },
      }),
      this.prisma.commentThread.count({
        where: { ...baseWhere, source: 'EXTERNAL' },
      }),
      this.prisma.commentThread.count({
        where: { ...baseWhere, status: 'OPEN' },
      }),
      this.prisma.commentThread.count({
        where: { ...baseWhere, status: 'RESOLVED' },
      }),
    ]);

    return {
      all,
      internal,
      external,
      open,
      resolved,
    };
  }

  async resolveThread(params: ResolveCommentThreadParams): Promise<CommentThread> {
    await this.prisma.commentThread.updateMany({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      data: {
        status: params.status,
        resolvedAt: params.status === 'RESOLVED' ? new Date() : null,
        resolvedBy: params.status === 'RESOLVED' ? params.actorUserId : null,
        updatedBy: params.actorUserId,
      },
    });

    const updated = await this.getThreadById({
      tenantId: params.tenantId,
      threadId: params.threadId,
    });

    if (!updated) throw new Error('thread not found');
    return updated;
  }
}
