'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/shared/markdown';
import { cn } from '@/lib/utils';
import { answerQuestion } from '@/lib/api/rag';

import type { ContextaAiMessage } from '@/features/contexta-ai/types';
import { BotIcon, LoaderIcon, SendHorizonalIcon, SendIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
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
    setAnswer(null);
    setError(null);
    setLoading(false);
  }, [props.conversationId]);

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
    setAnswer('');
    setError(null);
    setLoading(true);

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
    props.onSetMessages([...baseMessages, { role: 'assistant', content: '' }]);

    try {
      await answerQuestion(
        question,
        {
          onDelta: (delta) => {
            setAnswer((prev) => (prev ?? '') + delta);
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

  const inAnswerMode = props.messages.length > 0 || submittedQuestion !== null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-4 pt-6">
      {!inAnswerMode ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback><BotIcon></BotIcon></AvatarFallback>
            </Avatar>
            <div className="text-xl font-bold tracking-tight">
              Hi，有什么可以帮助你的？
            </div>
          </div>

          <Card className="w-full max-w-3xl">
            <CardContent className="relative p-4">
              <textarea
                className={cn(
                  'min-h-28 w-full resize-none rounded-lg border bg-transparent px-4 py-3 pr-14',
                  'text-base placeholder:text-muted-foreground/60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'ring-offset-background',
                )}
                placeholder="你可以问我关于知识库中的任何问题..."
                value={props.draft}
                onChange={(e) => props.onDraftChange(e.target.value)}
              />

              <div className="absolute bottom-6 right-6">
                {loading ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label="停止"
                    onClick={handleStop}
                  >
                    <StopIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    variant={canSend ? 'default' : 'secondary'}
                    disabled={!canSend}
                    aria-label="发送"
                    onClick={handleSend}
                  >
                    <SendHorizonalIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {formatZhDate(new Date())} · Contexta AI
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderIcon className="h-4 w-4" />
                    <span>汲取中</span>
                  </div>
                ) : null}

                <div className="mt-3 space-y-4">
                  {props.messages.map((m, idx) =>
                    m.role === 'user' ? (
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[85%] rounded-full bg-muted px-4 py-2 text-sm">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div key={idx} className="flex gap-3">
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                          C2
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-lg border bg-background p-3">
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

                {!loading &&
                props.messages.some(
                  (m) => m.role === 'assistant' && m.content.trim().length > 0,
                ) ? (
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
              </div>
            </div>
          </div>

          <div className="pb-6">
            <Card className="mx-auto w-full max-w-4xl">
              <CardContent className="relative p-4">
                <textarea
                  className={cn(
                    'min-h-20 w-full resize-none rounded-lg border bg-transparent px-4 py-3 pr-14',
                    'text-base placeholder:text-muted-foreground/60',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'ring-offset-background',
                  )}
                  placeholder="你可以问我关于知识库中的任何问题..."
                  value={props.draft}
                  onChange={(e) => props.onDraftChange(e.target.value)}
                />

                <div className="absolute bottom-6 right-6">
                  {loading ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="停止"
                      onClick={handleStop}
                    >
                      <StopIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant={canSend ? 'default' : 'secondary'}
                      disabled={!canSend}
                      aria-label="发送"
                      onClick={handleSend}
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
