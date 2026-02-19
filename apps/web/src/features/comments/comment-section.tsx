'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { commentsApi, publicCommentsApi } from '@/lib/api';
import type { CommentMessageDto, CommentThreadSummaryDto } from '@/lib/api/comments';
import type { PublicCommentAgreement } from '@/lib/api/public-comments';
import { CommentAgreementModal } from './comment-agreement-modal';

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

export function CommentSection(props: CommentSectionProps) {
  const [threads, setThreads] = useState<CommentThreadSummaryDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
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
  const [replyingThread, setReplyingThread] = useState<string | null>(null);

  const [agreement, setAgreement] = useState<PublicCommentAgreement | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  const isPublic = props.mode === 'public';
  const publicId = props.mode === 'public' ? props.publicId : null;
  const isPublicRegisteredUser = props.mode === 'public' ? props.canWrite : false;
  const commentCountForPublic = summary?.external ?? summary?.all ?? 0;

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
    void loadThreads(null);
    void loadAgreement();
  }, [props.pageId, loadThreads, loadAgreement]);

  const createThread = useCallback(async () => {
    const text = draft.trim();
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
          content: { text },
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

      setDraft('');
      await loadThreads(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '发表评论失败';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }, [draft, guestId, isPublicRegisteredUser, loadThreads, props]);

  const loadThreadMessages = useCallback(
    async (threadId: string) => {
      if (messagesByThread[threadId]) return;

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

  const submitReply = useCallback(
    async (threadId: string) => {
      const text = replyDraft[threadId]?.trim();
      if (!text) return;

      if (props.mode === 'public' && !isPublicRegisteredUser && !guestId) {
        toast.error('访客身份初始化中，请稍后重试');
        return;
      }

      setReplyingThread(threadId);
      try {
        if (props.mode === 'internal') {
          const res = await commentsApi.replyThread(threadId, {
            content: { text },
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
        await loadThreadMessages(threadId);
        await loadThreads(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : '回复失败';
        toast.error(message);
      } finally {
        setReplyingThread(null);
      }
    },
    [guestId, isPublicRegisteredUser, loadThreadMessages, loadThreads, props, replyDraft],
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

  return (
    <div className="mx-auto mt-10 w-full max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>评论</span>
            {isPublic ? (
              <span className="text-sm font-normal text-muted-foreground">
                共 {commentCountForPublic} 条外部评论
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">全部 {summary?.all ?? 0}</Badge>
                <Badge variant="outline">外部 {summary?.external ?? 0}</Badge>
                <Badge variant="outline">内部 {summary?.internal ?? 0}</Badge>
              </div>
            )}
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
                          {isPublic
                            ? `最近活跃 ${formatDate(thread.lastMessageAt)}`
                            : `${thread.source === 'EXTERNAL' ? '外部评论' : '内部评论'} · 最近活跃 ${formatDate(thread.lastMessageAt)}`}
                        </div>
                        <div className="text-sm">{item.latestMessage?.contentText ?? '暂无内容'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={thread.status === 'RESOLVED' ? 'secondary' : 'outline'}>
                          {thread.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => void toggleThread(thread.id)}>
                          {expanded ? '收起' : `展开(${thread.messageCount})`}
                        </Button>
                        {props.mode === 'internal' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void toggleResolved(thread.id, thread.status)}
                          >
                            {thread.status === 'RESOLVED' ? '重新打开' : '标记已解决'}
                          </Button>
                        ) : null}
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
