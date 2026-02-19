'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  SlateEditor,
  parseContentToSlateValue,
  type SlateValue,
} from '@/components/shared/slate-editor';
import { commentsApi, publicCommentsApi } from '@/lib/api';
import type { CommentMessageDto, CommentThreadSummaryDto } from '@/lib/api/comments';
import type { PublicCommentAgreement } from '@/lib/api/public-comments';
import { CommentAgreementModal } from './comment-agreement-modal';
import { cn } from '@/lib/utils';
import { useMeStore } from '@/stores';

const PUBLIC_COMMENT_GUEST_ID_STORAGE_KEY = 'contexta.public-comment.guest-id';

function createGuestId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type CommentSectionProps =
  | {
      mode: 'internal';
      pageId: string;
      spaceId: string;
    }
  | {
      mode: 'public';
      pageId: string;
      publicId: string;
      password?: string;
      canWrite: boolean;
    };

function formatDate(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return '-';
  return d.toLocaleString();
}

function moderationToToast(status?: string) {
  if (status === 'REVIEW') {
    toast.info('评论已提交，待审核后可见');
    return;
  }
  if (status === 'REJECT') {
    toast.error('评论内容包含敏感信息，已被拦截');
  }
}

type CommentMessageNode = {
  message: CommentMessageDto;
  children: CommentMessageNode[];
};

type ReplyTarget = {
  parentId?: string | null;
  replyToMessageId?: string | null;
  label?: string | null;
};

function visitSlateNode(node: unknown, out: string[]) {
  if (!node || typeof node !== 'object') return;

  const text = (node as { text?: unknown }).text;
  if (typeof text === 'string') {
    out.push(text);
    return;
  }

  const children = (node as { children?: unknown }).children;
  if (!Array.isArray(children)) return;

  for (const child of children) {
    visitSlateNode(child, out);
  }
  out.push('\n');
}

function slateToPlainText(value: SlateValue): string {
  const out: string[] = [];
  for (const node of value) {
    visitSlateNode(node, out);
  }
  return out.join('').replace(/\n{3,}/g, '\n\n').trim();
}

function buildMessageTree(messages: CommentMessageDto[]): CommentMessageNode[] {
  const nodeMap = new Map<string, CommentMessageNode>();

  for (const message of messages) {
    nodeMap.set(message.id, {
      message,
      children: [],
    });
  }

  const roots: CommentMessageNode[] = [];
  for (const message of messages) {
    const node = nodeMap.get(message.id);
    if (!node) continue;

    const parentId = message.parentId;
    const parentNode = parentId ? nodeMap.get(parentId) : undefined;
    if (parentNode) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function resolveAuthorName(params: {
  message: CommentMessageDto;
  currentUserId: string | null;
  currentNickname: string | null;
}): string {
  const { message, currentUserId, currentNickname } = params;

  if (message.authorUserId && message.authorUserId === currentUserId) {
    return currentNickname ?? '我';
  }

  if (message.authorType === 'GUEST_EXTERNAL') return '访客';
  if (message.authorType === 'REGISTERED_EXTERNAL') return '外部用户';
  if (message.authorType === 'COLLABORATOR') return '协作者';

  if (message.authorUserId) {
    return `成员 ${message.authorUserId.slice(-4)}`;
  }

  return '成员';
}

function fallbackByName(name: string): string {
  const text = name.trim();
  if (!text) return '评';
  return text[0];
}

export function CommentSection(props: CommentSectionProps) {
  const currentUserId = useMeStore((s) => s.user?.id ?? null);
  const currentNickname = useMeStore((s) => s.profile?.nickname ?? null);
  const currentAvatarUrl = useMeStore((s) => s.profile?.avatarUrl ?? null);

  const [threads, setThreads] = useState<CommentThreadSummaryDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [internalDraft, setInternalDraft] = useState<SlateValue>(() =>
    parseContentToSlateValue(''),
  );
  const [creating, setCreating] = useState(false);

  const [summary, setSummary] = useState<{
    all: number;
    internal: number;
    external: number;
    open: number;
    resolved: number;
  } | null>(null);

  const [expandedThreadIds, setExpandedThreadIds] = useState<Record<string, boolean>>({});
  const [messagesByThread, setMessagesByThread] = useState<Record<string, CommentMessageDto[]>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [internalReplyDraft, setInternalReplyDraft] = useState<Record<string, SlateValue>>({});
  const [replyTargetByThread, setReplyTargetByThread] = useState<Record<string, ReplyTarget>>(
    {},
  );
  const [replyingThread, setReplyingThread] = useState<string | null>(null);

  const [agreement, setAgreement] = useState<PublicCommentAgreement | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  const isPublic = props.mode === 'public';
  const publicId = props.mode === 'public' ? props.publicId : null;
  const isPublicRegisteredUser = props.mode === 'public' ? props.canWrite : false;
  const commentCountForPublic = summary?.external ?? summary?.all ?? 0;
  const internalDraftText = useMemo(() => slateToPlainText(internalDraft), [internalDraft]);

  const authHrefs = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        login: '/login',
        register: '/login',
      };
    }

    const next = encodeURIComponent(window.location.href);
    return {
      login: `/login?intent=comment-login&next=${next}`,
      register: `/login?intent=comment-register&next=${next}`,
    };
  }, []);

  useEffect(() => {
    if (!isPublic) {
      setGuestId(null);
      return;
    }

    if (isPublicRegisteredUser) {
      setGuestId(null);
      return;
    }

    try {
      const storageKey = `${PUBLIC_COMMENT_GUEST_ID_STORAGE_KEY}:${publicId ?? 'default'}`;
      const existing = window.localStorage.getItem(storageKey);
      if (existing) {
        setGuestId(existing);
        return;
      }

      const nextGuestId = createGuestId();
      window.localStorage.setItem(storageKey, nextGuestId);
      setGuestId(nextGuestId);
    } catch {
      setGuestId(createGuestId());
    }
  }, [isPublic, isPublicRegisteredUser, publicId]);

  const loadThreads = useCallback(
    async (cursor?: string | null) => {
      setLoading(true);
      try {
        if (props.mode === 'internal') {
          const res = await commentsApi.listThreads({
            pageId: props.pageId,
            status: 'ALL',
            cursor: cursor ?? undefined,
            limit: 20,
          });

          setThreads((prev) => (cursor ? [...prev, ...res.items] : res.items));
          setExpandedThreadIds((prev) => {
            const next = cursor ? { ...prev } : {};
            for (const item of res.items) {
              if (cursor) {
                if (!(item.thread.id in next)) {
                  next[item.thread.id] = false;
                }
              } else {
                next[item.thread.id] = true;
              }
            }
            return next;
          });
          setHasMore(Boolean(res.hasMore));
          setNextCursor(res.nextCursor ?? null);

          const s = await commentsApi.summary(props.pageId);
          setSummary(s);
        } else {
          const res = await publicCommentsApi.listThreads(props.publicId, {
            pageId: props.pageId,
            status: 'ALL',
            cursor: cursor ?? undefined,
            limit: 20,
            password: props.password,
          });

          setThreads((prev) => (cursor ? [...prev, ...res.items] : res.items));
          setHasMore(Boolean(res.hasMore));
          setNextCursor(res.nextCursor ?? null);

          const s = await publicCommentsApi.summary(props.publicId, {
            pageId: props.pageId,
            password: props.password,
          });
          setSummary(s);
        }
      } finally {
        setLoading(false);
      }
    },
    [props],
  );

  const loadAgreement = useCallback(async () => {
    if (props.mode !== 'public') return;
    try {
      const res = await publicCommentsApi.agreement(props.publicId, {
        password: props.password,
      });
      setAgreement(res);
    } catch {
      setAgreement(null);
    }
  }, [props]);

  useEffect(() => {
    if (!props.pageId) return;
    setThreads([]);
    setNextCursor(null);
    setHasMore(false);
    setExpandedThreadIds({});
    setMessagesByThread({});
    setReplyTargetByThread({});
    setReplyDraft({});
    setInternalReplyDraft({});
    setInternalDraft(parseContentToSlateValue(''));
    setDraft('');
    void loadThreads(null);
    void loadAgreement();
  }, [props.pageId, loadThreads, loadAgreement]);

  const createThread = useCallback(async () => {
    const text = props.mode === 'internal' ? internalDraftText : draft.trim();
    if (!text) return;

    if (props.mode === 'public' && !isPublicRegisteredUser && !guestId) {
      toast.error('访客身份初始化中，请稍后重试');
      return;
    }

    setCreating(true);
    try {
      if (props.mode === 'internal') {
        const res = await commentsApi.createThread({
          pageId: props.pageId,
          spaceId: props.spaceId,
          content: {
            text,
            slate: internalDraft,
          },
        });
        moderationToToast(res.moderation?.status);
      } else {
        const res = await publicCommentsApi.createThread(props.publicId, {
          pageId: props.pageId,
          content: { text },
          password: props.password,
          guestId: isPublicRegisteredUser ? undefined : guestId ?? undefined,
        });
        moderationToToast(res.moderation?.status);
      }

      if (props.mode === 'internal') {
        setInternalDraft(parseContentToSlateValue(''));
      } else {
        setDraft('');
      }
      await loadThreads(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '发表评论失败';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }, [
    draft,
    guestId,
    internalDraft,
    internalDraftText,
    isPublicRegisteredUser,
    loadThreads,
    props,
  ]);

  const loadThreadMessages = useCallback(
    async (threadId: string, force = false) => {
      if (!force && messagesByThread[threadId]) return;

      if (props.mode === 'internal') {
        const res = await commentsApi.listMessages(threadId, { limit: 50, order: 'asc' });
        setMessagesByThread((prev) => ({ ...prev, [threadId]: res.items }));
        return;
      }

      const res = await publicCommentsApi.listMessages(props.publicId, threadId, {
        limit: 50,
        order: 'asc',
        pageId: props.pageId,
        password: props.password,
      });
      setMessagesByThread((prev) => ({ ...prev, [threadId]: res.items }));
    },
    [messagesByThread, props],
  );

  useEffect(() => {
    const pendingThreadIds = threads
      .map((item) => item.thread.id)
      .filter((threadId) => expandedThreadIds[threadId] && !messagesByThread[threadId]);

    if (pendingThreadIds.length === 0) return;

    for (const threadId of pendingThreadIds) {
      void loadThreadMessages(threadId);
    }
  }, [expandedThreadIds, loadThreadMessages, messagesByThread, threads]);

  const toggleThread = useCallback(
    async (threadId: string) => {
      const next = !expandedThreadIds[threadId];
      setExpandedThreadIds((prev) => ({ ...prev, [threadId]: next }));
      if (next) {
        await loadThreadMessages(threadId);
      }
    },
    [expandedThreadIds, loadThreadMessages],
  );

  const prepareReply = useCallback(
    async (params: {
      threadId: string;
      parentId?: string | null;
      replyToMessageId?: string | null;
      label?: string | null;
    }) => {
      setExpandedThreadIds((prev) => ({ ...prev, [params.threadId]: true }));
      setReplyTargetByThread((prev) => ({
        ...prev,
        [params.threadId]: {
          parentId: params.parentId ?? null,
          replyToMessageId: params.replyToMessageId ?? null,
          label: params.label ?? null,
        },
      }));
      await loadThreadMessages(params.threadId);
    },
    [loadThreadMessages],
  );

  const submitReply = useCallback(
    async (threadId: string) => {
      const text =
        props.mode === 'internal'
          ? slateToPlainText(internalReplyDraft[threadId] ?? parseContentToSlateValue(''))
          : (replyDraft[threadId] ?? '').trim();
      if (!text) return;

      if (props.mode === 'public' && !isPublicRegisteredUser && !guestId) {
        toast.error('访客身份初始化中，请稍后重试');
        return;
      }

      setReplyingThread(threadId);
      try {
        if (props.mode === 'internal') {
          const target = replyTargetByThread[threadId];
          const res = await commentsApi.replyThread(threadId, {
            content: {
              text,
              slate: internalReplyDraft[threadId] ?? parseContentToSlateValue(''),
            },
            parentId: target?.parentId ?? undefined,
            replyToMessageId: target?.replyToMessageId ?? undefined,
          });
          moderationToToast(res.moderation?.status);
        } else {
          const res = await publicCommentsApi.replyThread(props.publicId, threadId, {
            content: { text },
            password: props.password,
            guestId: isPublicRegisteredUser ? undefined : guestId ?? undefined,
          });
          moderationToToast(res.moderation?.status);
        }

        setReplyDraft((prev) => ({ ...prev, [threadId]: '' }));
        setInternalReplyDraft((prev) => ({
          ...prev,
          [threadId]: parseContentToSlateValue(''),
        }));
        setReplyTargetByThread((prev) => ({ ...prev, [threadId]: {} }));
        await loadThreadMessages(threadId, true);
        await loadThreads(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : '回复失败';
        toast.error(message);
      } finally {
        setReplyingThread(null);
      }
    },
    [
      guestId,
      internalReplyDraft,
      isPublicRegisteredUser,
      loadThreadMessages,
      loadThreads,
      props,
      replyDraft,
      replyTargetByThread,
    ],
  );

  const toggleResolved = useCallback(
    async (threadId: string, currentStatus: string) => {
      if (props.mode !== 'internal') return;
      const nextStatus = currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
      await commentsApi.updateThreadStatus(threadId, nextStatus);
      await loadThreads(null);
    },
    [loadThreads, props.mode],
  );

  const renderInternalMessageNode = (
    node: CommentMessageNode,
    threadId: string,
    depth = 0,
  ) => {
    const message = node.message;
    const authorName = resolveAuthorName({
      message,
      currentUserId,
      currentNickname,
    });

    return (
      <div
        key={message.id}
        className={cn('space-y-2', depth > 0 && 'ml-10 border-l border-border/50 pl-5')}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={undefined} alt={authorName} />
            <AvatarFallback className="text-xs">{fallbackByName(authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{authorName}</span>
              <span className="text-muted-foreground">{formatDate(message.createdAt)}</span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7">{message.contentText}</div>
            <button
              type="button"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() =>
                void prepareReply({
                  threadId,
                  parentId: message.id,
                  replyToMessageId: message.id,
                  label: authorName,
                })
              }
            >
              回复
            </button>
          </div>
        </div>
        {node.children.length > 0 ? (
          <div className="space-y-4">
            {node.children.map((child) =>
              renderInternalMessageNode(child, threadId, depth + 1),
            )}
          </div>
        ) : null}
      </div>
    );
  };

  if (props.mode === 'internal') {
    return (
      <div className="mx-auto mt-10 w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">评论</h3>
          <div className="text-sm text-muted-foreground">
            全部 {summary?.all ?? 0} · 进行中 {summary?.open ?? 0} · 已解决 {summary?.resolved ?? 0}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={currentAvatarUrl ?? undefined} alt={currentNickname ?? '我'} />
            <AvatarFallback>{fallbackByName(currentNickname ?? '我')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-2xl border border-input bg-background p-3">
            <SlateEditor
              value={internalDraft}
              onChange={setInternalDraft}
              showToolbar
              toolbarVariant="compact"
              placeholder="写下你的评论..."
              className="min-h-[180px] px-2 py-2 text-sm leading-7"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                onClick={createThread}
                disabled={creating || !internalDraftText}
              >
                发表评论
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          {threads.map((item) => {
            const thread = item.thread;
            const expanded = Boolean(expandedThreadIds[thread.id]);
            const messages = messagesByThread[thread.id] ?? [];
            const messageTree = buildMessageTree(messages);
            const messagesLoaded = thread.id in messagesByThread;
            const replyTarget = replyTargetByThread[thread.id];
            const replyValue =
              internalReplyDraft[thread.id] ?? parseContentToSlateValue('');
            const hasReplies = thread.messageCount > 1;

            return (
              <article key={thread.id} className="space-y-4 border-b pb-6 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      最近活跃 {formatDate(thread.lastMessageAt)}
                    </div>
                    <div className="text-sm">{item.latestMessage?.contentText ?? '暂无内容'}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="transition-colors hover:text-foreground"
                      onClick={() => void toggleThread(thread.id)}
                    >
                      {expanded ? '收起' : hasReplies ? `查看回复 (${thread.messageCount - 1})` : '展开'}
                    </button>
                    <button
                      type="button"
                      className="transition-colors hover:text-foreground"
                      onClick={() =>
                        void prepareReply({
                          threadId: thread.id,
                          parentId: null,
                          replyToMessageId: null,
                        })
                      }
                    >
                      回复
                    </button>
                    <button
                      type="button"
                      className="transition-colors hover:text-foreground"
                      onClick={() => void toggleResolved(thread.id, thread.status)}
                    >
                      {thread.status === 'RESOLVED' ? '重新打开' : '标记已解决'}
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="space-y-5">
                    {!messagesLoaded ? (
                      <div className="text-sm text-muted-foreground">加载中...</div>
                    ) : messageTree.length > 0 ? (
                      <div className="space-y-4">
                        {messageTree.map((node) => renderInternalMessageNode(node, thread.id))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">暂无回复</div>
                    )}

                    <div className="ml-12 rounded-xl border border-input bg-background p-3">
                      {replyTarget?.label ? (
                        <div className="mb-2 text-xs text-muted-foreground">
                          回复 {replyTarget.label}
                        </div>
                      ) : null}
                      <SlateEditor
                        value={replyValue}
                        onChange={(value) =>
                          setInternalReplyDraft((prev) => ({
                            ...prev,
                            [thread.id]: value,
                          }))
                        }
                        showToolbar={false}
                        placeholder="写下你的回复..."
                        className="min-h-[120px] px-2 py-2 text-sm leading-7"
                      />
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setReplyTargetByThread((prev) => ({ ...prev, [thread.id]: {} }))
                          }
                        >
                          取消
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void submitReply(thread.id)}
                          disabled={
                            replyingThread === thread.id || !slateToPlainText(replyValue)
                          }
                        >
                          回复
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {threads.length === 0 && !loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无评论</div>
          ) : null}

          {hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => void loadThreads(nextCursor)}
                disabled={loading}
              >
                加载更多
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>评论</span>
            <span className="text-sm font-normal text-muted-foreground">
              共 {commentCountForPublic} 条外部评论
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPublic ? (
            <div className="text-sm text-muted-foreground">
              发表评论即表示你已阅读并同意
              <button
                type="button"
                className="px-1 text-primary underline underline-offset-4"
                onClick={() => setAgreementOpen(true)}
              >
                《评论协议》
              </button>
              ，并承诺遵守社区规范。
            </div>
          ) : null}

          <div className="space-y-2">
            <Textarea
              placeholder={
                isPublic && !isPublicRegisteredUser
                  ? '以访客身份发表评论（无需注册）'
                  : '写下你的评论...'
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={creating}
            />
            <div className="flex items-center justify-between">
              {isPublic && !isPublicRegisteredUser ? (
                <div className="text-sm text-muted-foreground">
                  无需注册可直接评论，
                  <a className="px-1 text-primary underline" href={authHrefs.login}>
                    去登录
                  </a>
                  或
                  <a className="px-1 text-primary underline" href={authHrefs.register}>
                    去注册
                  </a>
                  可同步评论与后续回复。
                </div>
              ) : (
                <div />
              )}
              <Button
                type="button"
                onClick={createThread}
                disabled={creating || !draft.trim()}
              >
                发表评论
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            {threads.map((item) => {
              const thread = item.thread;
              const expanded = Boolean(expandedThreadIds[thread.id]);
              const messages = messagesByThread[thread.id] ?? [];
              return (
                <Card key={thread.id} className="border-dashed">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          最近活跃 {formatDate(thread.lastMessageAt)}
                        </div>
                        <div className="text-sm">{item.latestMessage?.contentText ?? '暂无内容'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void toggleThread(thread.id)}>
                          {expanded ? '收起' : `展开(${thread.messageCount})`}
                        </Button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="space-y-3 border-t pt-3">
                        <div className="space-y-2">
                          {messages.map((message) => (
                            <div key={message.id} className="rounded-md bg-muted/40 p-2 text-sm">
                              <div className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</div>
                              <div>{message.contentText}</div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            placeholder={isPublic && !isPublicRegisteredUser ? '以访客身份回复...' : '回复此线程...'}
                            value={replyDraft[thread.id] ?? ''}
                            onChange={(event) =>
                              setReplyDraft((prev) => ({
                                ...prev,
                                [thread.id]: event.target.value,
                              }))
                            }
                            disabled={replyingThread === thread.id}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void submitReply(thread.id)}
                            disabled={replyingThread === thread.id || !(replyDraft[thread.id] ?? '').trim()}
                          >
                            回复
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}

            {threads.length === 0 && !loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">暂无评论</div>
            ) : null}

            {hasMore ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void loadThreads(nextCursor)}
                  disabled={loading}
                >
                  加载更多
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <CommentAgreementModal
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        agreement={agreement}
      />
    </div>
  );
}
