'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Plus,
  Reply,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Input } from '@/components/ui/input';
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
const PUBLIC_COMMENT_GUEST_PROFILE_STORAGE_KEY = 'contexta.public-comment.guest-profile';

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

function formatCommentTime(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return '-';

  const now = new Date();
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowStart.getTime() - dStart.getTime()) / 86_400_000);

  const hm = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (diffDays === 0) return `今天 ${hm}`;
  if (diffDays === 1) return `昨天 ${hm}`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hm}`;
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

type CommentAuthorIdentity = {
  authorType?: string | null;
  authorUserId?: string | null;
  authorGuestId?: string | null;
  authorGuestNickname?: string | null;
  id?: string | null;
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
  author: CommentAuthorIdentity;
  currentUserId: string | null;
  currentNickname: string | null;
}): string {
  const { author, currentUserId, currentNickname } = params;

  if (author.authorUserId && author.authorUserId === currentUserId) {
    return currentNickname ?? '我';
  }

  if (author.authorType === 'GUEST_EXTERNAL') {
    if (author.authorGuestNickname && author.authorGuestNickname.trim()) {
      return `访客·${author.authorGuestNickname.trim()}`;
    }
    if (author.authorGuestId) {
      return `访客-${author.authorGuestId.slice(-4).toUpperCase()}`;
    }
    return '访客';
  }
  if (author.authorType === 'REGISTERED_EXTERNAL') {
    if (author.authorUserId) return `外部用户-${author.authorUserId.slice(-4)}`;
    return '外部用户';
  }
  if (author.authorType === 'COLLABORATOR') return '协作者';

  if (author.authorUserId) {
    return `成员 ${author.authorUserId.slice(-4)}`;
  }

  return '成员';
}

function toUserFacingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message.includes('comment content blocked')) {
      return '评论包含敏感信息，请调整后重试';
    }
    if (error.message.includes('guest email invalid')) {
      return '访客邮箱格式不正确';
    }
    return error.message;
  }
  return fallback;
}

function buildGuestNicknameFromId(guestId: string): string {
  const suffix = guestId.slice(-4).toUpperCase() || 'GUEST';
  return `访客-${suffix}`;
}

function fallbackByName(name: string): string {
  const text = name.trim();
  if (!text) return '评';
  return text[0];
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildDefaultAvatarDataUri(seed: string, displayName: string): string {
  const hash = hashText(seed || displayName || 'comment');
  const hue = hash % 360;
  const hue2 = (hue + 38) % 360;
  const initial = fallbackByName(displayName);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue} 70% 62%)' />
      <stop offset='100%' stop-color='hsl(${hue2} 70% 52%)' />
    </linearGradient>
  </defs>
  <rect width='64' height='64' rx='32' fill='url(#g)' />
  <text x='32' y='36' text-anchor='middle' font-size='26' font-family='Arial, sans-serif' fill='white'>${initial}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveAuthorAvatarSrc(params: {
  author: CommentAuthorIdentity;
  authorName: string;
  currentUserId: string | null;
  currentAvatarUrl: string | null;
}): string {
  const { author, authorName, currentUserId, currentAvatarUrl } = params;

  if (author.authorUserId && author.authorUserId === currentUserId && currentAvatarUrl) {
    return currentAvatarUrl;
  }

  const seed =
    (author.authorUserId && `u:${author.authorUserId}`) ||
    (author.authorGuestId && `g:${author.authorGuestId}`) ||
    (author.id && `m:${author.id}`) ||
    `a:${author.authorType ?? 'member'}:${authorName}`;

  return buildDefaultAvatarDataUri(seed, authorName);
}

function InternalActionIconButton(props: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors',
        'hover:border-border hover:bg-accent/60 hover:text-foreground',
        props.active && 'text-foreground',
      )}
    >
      {props.children}
    </button>
  );
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
  const [internalSourceFilter, setInternalSourceFilter] = useState<
    'ALL' | 'INTERNAL' | 'EXTERNAL'
  >('ALL');

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
  const [guestProfile, setGuestProfile] = useState<{ nickname: string; email: string }>({
    nickname: '',
    email: '',
  });

  const mode = props.mode;
  const pageId = props.pageId;
  const isPublic = props.mode === 'public';
  const publicId = props.mode === 'public' ? props.publicId : null;
  const publicPassword = props.mode === 'public' ? props.password : undefined;
  const isPublicRegisteredUser = props.mode === 'public' ? props.canWrite : false;
  const commentCountForPublic = summary?.external ?? summary?.all ?? 0;
  const internalDraftText = useMemo(() => slateToPlainText(internalDraft), [internalDraft]);
  const composerAvatarSrc = useMemo(
    () =>
      currentAvatarUrl ??
      buildDefaultAvatarDataUri(
        `composer:${currentUserId ?? currentNickname ?? 'me'}`,
        currentNickname ?? '我',
      ),
    [currentAvatarUrl, currentNickname, currentUserId],
  );

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
      setGuestProfile({ nickname: '', email: '' });
      return;
    }

    if (isPublicRegisteredUser) {
      setGuestId(null);
      setGuestProfile({ nickname: '', email: '' });
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

  useEffect(() => {
    if (!isPublic || isPublicRegisteredUser || !guestId) return;

    const profileStorageKey = `${PUBLIC_COMMENT_GUEST_PROFILE_STORAGE_KEY}:${publicId ?? 'default'}`;
    let storedNickname = '';
    let storedEmail = '';

    try {
      const raw = window.localStorage.getItem(profileStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { nickname?: unknown; email?: unknown };
        if (typeof parsed.nickname === 'string') {
          storedNickname = parsed.nickname;
        }
        if (typeof parsed.email === 'string') {
          storedEmail = parsed.email;
        }
      }
    } catch {
      // Ignore local storage parse failures.
    }

    setGuestProfile({
      nickname: storedNickname.trim() || buildGuestNicknameFromId(guestId),
      email: storedEmail.trim(),
    });
  }, [guestId, isPublic, isPublicRegisteredUser, publicId]);

  useEffect(() => {
    if (!isPublic || isPublicRegisteredUser || !publicId) return;
    const profileStorageKey = `${PUBLIC_COMMENT_GUEST_PROFILE_STORAGE_KEY}:${publicId}`;
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(guestProfile));
    } catch {
      // Ignore local storage write failures.
    }
  }, [guestProfile, isPublic, isPublicRegisteredUser, publicId]);

  const loadThreads = useCallback(
    async (cursor?: string | null) => {
      setLoading(true);
      try {
        if (mode === 'internal') {
          const res = await commentsApi.listThreads({
            pageId,
            source: internalSourceFilter,
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

          const s = await commentsApi.summary(pageId);
          setSummary(s);
        } else {
          const res = await publicCommentsApi.listThreads(publicId ?? '', {
            pageId,
            status: 'ALL',
            cursor: cursor ?? undefined,
            limit: 20,
            password: publicPassword,
          });

          setThreads((prev) => (cursor ? [...prev, ...res.items] : res.items));
          setHasMore(Boolean(res.hasMore));
          setNextCursor(res.nextCursor ?? null);

          const s = await publicCommentsApi.summary(publicId ?? '', {
            pageId,
            password: publicPassword,
          });
          setSummary(s);
        }
      } finally {
        setLoading(false);
      }
    },
    [internalSourceFilter, mode, pageId, publicId, publicPassword],
  );

  const loadAgreement = useCallback(async () => {
    if (mode !== 'public' || !publicId) return;
    try {
      const res = await publicCommentsApi.agreement(publicId, {
        password: publicPassword,
      });
      setAgreement(res);
    } catch {
      setAgreement(null);
    }
  }, [mode, publicId, publicPassword]);

  useEffect(() => {
    if (!pageId) return;
    setThreads([]);
    setNextCursor(null);
    setHasMore(false);
    setExpandedThreadIds({});
    setMessagesByThread({});
    setReplyTargetByThread({});
    setReplyDraft({});
    setInternalReplyDraft({});
    if (mode === 'internal') {
      setInternalDraft(parseContentToSlateValue(''));
    } else {
      setDraft('');
    }
  }, [mode, pageId, publicId]);

  useEffect(() => {
    if (!pageId) return;
    void loadThreads(null);
  }, [pageId, loadThreads]);

  useEffect(() => {
    void loadAgreement();
  }, [loadAgreement]);

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
          guestProfile:
            isPublicRegisteredUser
              ? undefined
              : {
                  nickname: guestProfile.nickname.trim() || undefined,
                  email: guestProfile.email.trim() || undefined,
                },
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
      const message = toUserFacingErrorMessage(error, '发表评论失败');
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }, [
    draft,
    guestId,
    guestProfile.email,
    guestProfile.nickname,
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
            guestProfile:
              isPublicRegisteredUser
                ? undefined
                : {
                    nickname: guestProfile.nickname.trim() || undefined,
                    email: guestProfile.email.trim() || undefined,
                  },
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
        const message = toUserFacingErrorMessage(error, '回复失败');
        toast.error(message);
      } finally {
        setReplyingThread(null);
      }
    },
    [
      guestId,
      guestProfile.email,
      guestProfile.nickname,
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
    authorNameByMessageId: Map<string, string>,
    depth = 0,
  ) => {
    const message = node.message;
    const authorName =
      authorNameByMessageId.get(message.id) ??
      resolveAuthorName({
        author: message,
        currentUserId,
        currentNickname,
      });
    const avatarSrc = resolveAuthorAvatarSrc({
      author: message,
      authorName,
      currentUserId,
      currentAvatarUrl,
    });
    const replyToName = message.replyToMessageId
      ? authorNameByMessageId.get(message.replyToMessageId) ?? null
      : null;

    return (
      <div
        key={message.id}
        className={cn('space-y-2', depth > 0 && 'ml-9 border-l border-border/50 pl-4')}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 border border-border/70">
            <AvatarImage src={avatarSrc} alt={authorName} />
            <AvatarFallback className="text-xs">{fallbackByName(authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{authorName}</span>
              {replyToName ? (
                <>
                  <span className="text-muted-foreground">›</span>
                  <span className="text-muted-foreground">{replyToName}</span>
                </>
              ) : null}
              <span className="text-muted-foreground">{formatCommentTime(message.createdAt)}</span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7">{message.contentText}</div>
            <div className="flex items-center gap-1 pt-1">
              <InternalActionIconButton
                title={`回复 ${authorName}`}
                onClick={() =>
                  void prepareReply({
                    threadId,
                    parentId: message.id,
                    replyToMessageId: message.id,
                    label: authorName,
                  })
                }
              >
                <Reply className="h-4 w-4" />
              </InternalActionIconButton>
              <InternalActionIconButton
                title="继续当前线程"
                onClick={() =>
                  void prepareReply({
                    threadId,
                    parentId: message.parentId ?? null,
                    replyToMessageId: message.id,
                    label: authorName,
                  })
                }
              >
                <Plus className="h-4 w-4" />
              </InternalActionIconButton>
            </div>
          </div>
        </div>
        {node.children.length > 0 ? (
          <div className="space-y-4">
            {node.children.map((child) =>
              renderInternalMessageNode(child, threadId, authorNameByMessageId, depth + 1),
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
        </div>

        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={composerAvatarSrc} alt={currentNickname ?? '我'} />
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

        <div className="flex items-center justify-between gap-3">
          <Segmented
            value={internalSourceFilter}
            onValueChange={setInternalSourceFilter}
            options={[
              { value: 'ALL', label: `全部 ${summary?.all ?? 0}` },
              { value: 'INTERNAL', label: `内部 ${summary?.internal ?? 0}` },
              { value: 'EXTERNAL', label: `外部 ${summary?.external ?? 0}` },
            ]}
          />
          <div className="text-sm text-muted-foreground">
            进行中 {summary?.open ?? 0} · 已解决 {summary?.resolved ?? 0}
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
            const latestAuthor: CommentAuthorIdentity = item.latestMessage
              ? {
                  id: item.latestMessage.id,
                  authorType: item.latestMessage.authorType,
                  authorUserId: item.latestMessage.authorUserId ?? null,
                  authorGuestId: item.latestMessage.authorGuestId ?? null,
                  authorGuestNickname: item.latestMessage.authorGuestNickname ?? null,
                }
              : { id: thread.id, authorType: thread.source === 'EXTERNAL' ? 'GUEST_EXTERNAL' : 'MEMBER' };
            const latestAuthorName = resolveAuthorName({
              author: latestAuthor,
              currentUserId,
              currentNickname,
            });
            const latestAvatarSrc = resolveAuthorAvatarSrc({
              author: latestAuthor,
              authorName: latestAuthorName,
              currentUserId,
              currentAvatarUrl,
            });
            const authorNameByMessageId = new Map(
              messages.map((message) => [
                message.id,
                resolveAuthorName({
                  author: message,
                  currentUserId,
                  currentNickname,
                }),
              ]),
            );
            const replyTarget = replyTargetByThread[thread.id];
            const replyValue =
              internalReplyDraft[thread.id] ?? parseContentToSlateValue('');
            const hasReplies = thread.messageCount > 1;

            return (
              <article key={thread.id} className="space-y-4 border-b pb-6 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar className="mt-0.5 h-8 w-8 border border-border/70">
                      <AvatarImage src={latestAvatarSrc} alt={latestAuthorName} />
                      <AvatarFallback className="text-xs">
                        {fallbackByName(latestAuthorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {latestAuthorName} · 最近活跃 {formatCommentTime(thread.lastMessageAt)}
                      </div>
                      <div className="truncate text-sm">
                        {item.latestMessage?.contentText ?? '暂无内容'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pr-1 text-xs text-muted-foreground">
                      {hasReplies ? thread.messageCount - 1 : 0}
                    </span>
                    <InternalActionIconButton
                      title={expanded ? '收起回复' : '展开回复'}
                      onClick={() => void toggleThread(thread.id)}
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </InternalActionIconButton>
                    <InternalActionIconButton
                      title="回复线程"
                      onClick={() =>
                        void prepareReply({
                          threadId: thread.id,
                          parentId: null,
                          replyToMessageId: null,
                        })
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                    </InternalActionIconButton>
                    <InternalActionIconButton
                      title={thread.status === 'RESOLVED' ? '重新打开' : '标记已解决'}
                      active={thread.status === 'RESOLVED'}
                      onClick={() => void toggleResolved(thread.id, thread.status)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </InternalActionIconButton>
                  </div>
                </div>

                {expanded ? (
                  <div className="space-y-5">
                    {!messagesLoaded ? (
                      <div className="text-sm text-muted-foreground">加载中...</div>
                    ) : messageTree.length > 0 ? (
                      <div className="space-y-4">
                        {messageTree.map((node) =>
                          renderInternalMessageNode(
                            node,
                            thread.id,
                            authorNameByMessageId,
                          ),
                        )}
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
    <div className="mx-auto mt-10 w-full max-w-5xl rounded-2xl border border-border/70 bg-background p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">评论</h3>
        <span className="text-sm text-muted-foreground">共 {commentCountForPublic} 条外部评论</span>
      </div>

      {isPublic ? (
        <div className="mt-3 text-sm text-muted-foreground">
          发表评论即表示你已阅读并同意
          <button
            type="button"
            className="ml-1 font-medium text-primary transition-colors hover:text-primary/80"
            onClick={() => setAgreementOpen(true)}
          >
            《评论协议》
          </button>
          ，并承诺遵守社区规范。
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <Textarea
          placeholder={
            isPublic && !isPublicRegisteredUser
              ? '以访客身份发表评论（无需注册）'
              : '写下你的评论...'
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={creating}
          className="min-h-[110px] border-border/70"
        />

        {isPublic && !isPublicRegisteredUser ? (
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={guestProfile.nickname}
              onChange={(event) =>
                setGuestProfile((prev) => ({ ...prev, nickname: event.target.value }))
              }
              placeholder="访客昵称（用于区分用户）"
              maxLength={30}
            />
            <Input
              type="email"
              value={guestProfile.email}
              onChange={(event) =>
                setGuestProfile((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="邮箱（选填，用于接收回复通知）"
              maxLength={320}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isPublic && !isPublicRegisteredUser ? (
            <div className="text-sm text-muted-foreground">
              无需注册可直接评论，
              <a className="px-1 font-medium text-primary hover:text-primary/80" href={authHrefs.login}>
                去登录
              </a>
              或
              <a className="px-1 font-medium text-primary hover:text-primary/80" href={authHrefs.register}>
                去注册
              </a>
              可同步评论与后续回复。
            </div>
          ) : (
            <div />
          )}
          <Button type="button" onClick={createThread} disabled={creating || !draft.trim()}>
            发表评论
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="space-y-3">
        {threads.map((item) => {
          const thread = item.thread;
          const expanded = Boolean(expandedThreadIds[thread.id]);
          const messages = messagesByThread[thread.id] ?? [];
          const latestAuthor: CommentAuthorIdentity = item.latestMessage
            ? {
                id: item.latestMessage.id,
                authorType: item.latestMessage.authorType,
                authorUserId: item.latestMessage.authorUserId ?? null,
                authorGuestId: item.latestMessage.authorGuestId ?? null,
                authorGuestNickname: item.latestMessage.authorGuestNickname ?? null,
              }
            : { id: thread.id, authorType: thread.source === 'EXTERNAL' ? 'GUEST_EXTERNAL' : 'MEMBER' };
          const latestAuthorName = resolveAuthorName({
            author: latestAuthor,
            currentUserId,
            currentNickname,
          });
          const latestAvatarSrc = resolveAuthorAvatarSrc({
            author: latestAuthor,
            authorName: latestAuthorName,
            currentUserId,
            currentAvatarUrl,
          });

          return (
            <article key={thread.id} className="rounded-xl bg-muted/25 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar className="mt-0.5 h-8 w-8 border border-border/70">
                    <AvatarImage src={latestAvatarSrc} alt={latestAuthorName} />
                    <AvatarFallback className="text-xs">{fallbackByName(latestAuthorName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {latestAuthorName} · 最近活跃 {formatCommentTime(thread.lastMessageAt)}
                    </div>
                    <div className="truncate text-sm">{item.latestMessage?.contentText ?? '暂无内容'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="pr-1 text-xs text-muted-foreground">
                    {thread.messageCount}
                  </span>
                  <InternalActionIconButton
                    title={expanded ? '收起回复' : '展开回复'}
                    onClick={() => void toggleThread(thread.id)}
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </InternalActionIconButton>
                </div>
              </div>

              {expanded ? (
                <div className="space-y-3 border-t border-border/60 pt-3">
                  <div className="space-y-2">
                    {messages.map((message) => {
                      const authorName = resolveAuthorName({
                        author: message,
                        currentUserId,
                        currentNickname,
                      });
                      const avatarSrc = resolveAuthorAvatarSrc({
                        author: message,
                        authorName,
                        currentUserId,
                        currentAvatarUrl,
                      });

                      return (
                        <div key={message.id} className="flex items-start gap-3 py-2 text-sm">
                          <Avatar className="mt-0.5 h-7 w-7 border border-border/70">
                            <AvatarImage src={avatarSrc} alt={authorName} />
                            <AvatarFallback className="text-[11px]">{fallbackByName(authorName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {authorName} · {formatCommentTime(message.createdAt)}
                            </div>
                            <div className="whitespace-pre-wrap">{message.contentText}</div>
                          </div>
                        </div>
                      );
                    })}
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
                      className="border-border/70"
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
            </article>
          );
        })}

        {threads.length === 0 && !loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">暂无评论</div>
        ) : null}

        {hasMore ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => void loadThreads(nextCursor)} disabled={loading}>
              加载更多
            </Button>
          </div>
        ) : null}
      </div>

      <CommentAgreementModal
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        agreement={agreement}
      />
    </div>
  );
}
