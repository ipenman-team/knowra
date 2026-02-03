'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Markdown } from '@/components/shared/markdown';
import { cn } from '@/lib/utils';
import { contextaAiApi } from '@/lib/api';

import type { ContextaAiMessage } from '@/features/contexta-ai/types';
import { ArrowUpIcon, Bot, Loader2, Plus, Share2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function hasAbortName(e: unknown): e is { name: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'name' in e &&
    typeof (e as { name: unknown }).name === 'string'
  );
}

function StopIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      aria-hidden
    >
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

function formatZhDate(d: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const nf = new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  });
  return `${nf.format(size)} ${units[unitIndex]}`;
}

export function ContextaAiContent(props: {
  conversationId: string;
  title: string;
  messages: ContextaAiMessage[];
  draft: string;
  onDraftChange: (draft: string) => void;
  onSetMessages: (messages: ContextaAiMessage[]) => void;
  onSetTitle: (title: string) => void;
}) {
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;

      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  const canSend = useMemo(
    () => props.draft.trim().length > 0 && !loading,
    [props.draft, loading],
  );

  useEffect(() => {
    // When switching conversations, reset transient request state.
    abortRef.current?.abort();
    abortRef.current = null;
    setSubmittedQuestion(null);
    setError(null);
    setLoading(false);
    setAttachments([]);
    setCopied(false);
  }, [props.conversationId]);

  useEffect(() => {
    // Best-effort scroll to bottom when messages update.
    const el = scrollAreaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [props.messages.length, loading]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 180;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [props.draft, props.conversationId]);

  function handleStop() {
    if (!loading) return;
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function upsertAssistant(
    messages: ContextaAiMessage[],
    content: string,
  ): ContextaAiMessage[] {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      return [...messages.slice(0, -1), { role: 'assistant', content }];
    }
    return [...messages, { role: 'assistant', content }];
  }

  async function sendQuestion(q: string, options?: { updateInput?: boolean }) {
    const question = q.trim();
    if (!question || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmittedQuestion(question);
    if (options?.updateInput !== false) props.onDraftChange('');
    setError(null);
    setLoading(true);
    answerRef.current = '';

    const shouldSetTitle =
      props.messages.length === 0 || props.title === '新对话';
    if (shouldSetTitle) {
      const nextTitle =
        question.length > 18 ? question.slice(0, 18) + '…' : question;
      props.onSetTitle(nextTitle);
    }

    const baseMessages: ContextaAiMessage[] = [
      ...props.messages,
      { role: 'user', content: question },
    ];
    // Do not pre-insert an empty assistant message; only show a bubble when data arrives.
    props.onSetMessages(baseMessages);

    try {
      await contextaAiApi.chatStream(
        {
          conversationId: props.conversationId,
          message: question,
        },
        {
          onDelta: (delta) => {
            props.onSetMessages(
              upsertAssistant(baseMessages, (answerRef.current ?? '') + delta),
            );
            answerRef.current = (answerRef.current ?? '') + delta;
          },
        },
        { signal: controller.signal },
      );
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === 'AbortError') ||
        (hasAbortName(e) && e.name === 'AbortError')
      ) {
        return;
      }
      const message = e instanceof Error ? e.message : '请求失败';
      setError(message);
      // Keep the user question in history; append a short assistant error.
      props.onSetMessages(
        upsertAssistant(baseMessages, `请求失败：${message}`),
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
      answerRef.current = null;
    }
  }

  async function handleSend() {
    const q = props.draft.trim();
    if (!q || loading) return;

    await sendQuestion(q, { updateInput: true });
    setAttachments([]);
  }

  async function handleRetry() {
    if (!submittedQuestion || loading) return;
    await sendQuestion(submittedQuestion, { updateInput: false });
  }

  async function handleRegenerate() {
    if (loading) return;
    const lastUser = [...props.messages]
      .reverse()
      .find((m) => m.role === 'user')?.content;
    if (!lastUser) return;
    // Remove trailing assistant message before regenerating.
    const trimmed =
      props.messages.length > 0 &&
      props.messages[props.messages.length - 1]?.role === 'assistant'
        ? props.messages.slice(0, -1)
        : props.messages;
    props.onSetMessages(trimmed);
    await sendQuestion(lastUser, { updateInput: false });
  }

  function handlePickFiles() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList);
    setAttachments((prev) => {
      const merged = [...prev];
      for (const f of next) {
        if (!merged.some((x) => x.name === f.name && x.size === f.size)) {
          merged.push(f);
        }
      }
      return merged;
    });
  }

  function handleRemoveAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleShare() {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (
          navigator as unknown as {
            share: (d: { title?: string; url?: string }) => Promise<void>;
          }
        ).share({
          title: props.title,
          url,
        });
        return;
      }
    } catch {
      // Ignore and fallback to copy.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 1500);
    } catch {
      // If clipboard fails, do nothing.
    }
  }

  const inAnswerMode = props.messages.length > 0 || submittedQuestion !== null;

  const showRegenerate =
    !loading &&
    props.messages.some(
      (m) => m.role === 'assistant' && m.content.trim().length > 0,
    );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{props.title}</div>
          </div>

          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="分享"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? '已复制链接' : '分享'}</TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {inAnswerMode ? (
          <>
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              {formatZhDate(new Date())} · Contexta AI
            </div>

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>汲取中</span>
              </div>
            ) : null}

            <div className="mt-3 space-y-4">
              {props.messages.map((m, idx) =>
                m.role === 'assistant' &&
                m.content.trim().length === 0 ? null : m.role === 'user' ? (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-background">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-xl border bg-background p-3">
                        <Markdown content={m.content} />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {error ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="text-sm text-destructive">{error}</div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRetry}
                  disabled={loading}
                >
                  重试
                </Button>
              </div>
            ) : null}

            {showRegenerate ? (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRegenerate}
                >
                  重新生成
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback>
                <Bot className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <div className="text-xl font-bold tracking-tight">
              Hi，有什么可以帮助你的？
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-4/5 max-w-4xl">
          {attachments.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((f, idx) => (
                <div
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  className="group inline-flex max-w-full items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                >
                  <span className="max-w-[240px] truncate">{f.name}</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(f.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`移除附件 ${f.name}`}
                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    onClick={() => handleRemoveAttachment(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <InputGroup>
            <InputGroupTextarea
              ref={textareaRef}
              placeholder="你可以问我关于知识库中的任何问题..."
              value={props.draft}
              onChange={(e) => props.onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              className={cn('min-h-14 pr-2', 'text-base md:text-sm')}
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                size="icon-xs"
                variant="outline"
                className="rounded-full"
                aria-label="上传文件"
                onClick={handlePickFiles}
              >
                <Plus className="h-4 w-4" />
              </InputGroupButton>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.currentTarget.value = '';
                }}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton variant="ghost">自动</InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="[--radius:0.95rem]"
                >
                  <DropdownMenuItem>自动</DropdownMenuItem>
                  <DropdownMenuItem>Agent</DropdownMenuItem>
                  <DropdownMenuItem>Manual</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <InputGroupText className="ml-auto hidden sm:flex text-xs">
                发送
              </InputGroupText>
              <Separator orientation="vertical" className="!h-4" />
              {loading ? (
                <InputGroupButton
                  size="icon-sm"
                  variant="secondary"
                  aria-label="停止"
                  onClick={handleStop}
                >
                  <StopIcon className="h-4 w-4" />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  variant={canSend ? 'default' : 'secondary'}
                  className="rounded-full"
                  aria-label="发送"
                  size="icon-xs"
                  disabled={!canSend}
                  onClick={() => void handleSend()}
                >
                  <ArrowUpIcon />
                  <span className="sr-only">发送</span>
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
