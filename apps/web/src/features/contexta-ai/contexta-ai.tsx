"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import { answerQuestion } from "@/lib/api/rag";

function SendIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      aria-hidden
    >
      <path
        d="M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("animate-spin", props.className)}
      aria-hidden
    >
      <path
        d="M12 3a9 9 0 109 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

export function ContextaAiView() {
  const [value, setValue] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const canSend = useMemo(() => value.trim().length > 0 && !loading, [value, loading]);

  function handleStop() {
    if (!loading) return;
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function handleSend() {
    const q = value.trim();
    if (!q || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmittedQuestion(q);
    setValue("");
    setAnswer("");
    setError(null);
    setLoading(true);

    try {
      await answerQuestion(q, {
        onDelta: (delta) => {
          setAnswer((prev) => (prev ?? "") + delta);
        },
      }, { signal: controller.signal });
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === "AbortError") ||
        (typeof e === "object" && e !== null && "name" in e && (e as any).name === "AbortError")
      ) {
        return;
      }
      const message = e instanceof Error ? e.message : "请求失败";
      setError(message);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  const inAnswerMode = submittedQuestion !== null;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col px-4 pt-10">
      {!inAnswerMode ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-background">
              <span className="text-xl font-semibold">C</span>
            </div>
            <div className="text-xl font-bold tracking-tight">Hi，有什么可以帮助你的？</div>
          </div>

          <Card className="w-full max-w-3xl">
            <CardContent className="relative p-4">
              <textarea
                className={cn(
                  "min-h-28 w-full resize-none rounded-lg border bg-transparent px-4 py-3 pr-14",
                  "text-base placeholder:text-muted-foreground/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "ring-offset-background",
                )}
                placeholder="你可以问我关于知识库中的任何问题..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
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
                    variant={canSend ? "default" : "secondary"}
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
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {formatZhDate(new Date())} · Contexta AI
          </div>

          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-full bg-muted px-4 py-2 text-sm">
              {submittedQuestion}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
              C
            </div>

            <div className="min-w-0 flex-1">
              <div className="max-h-[52vh] overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SpinnerIcon className="h-4 w-4" />
                    <span>汲取中</span>
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-3 text-sm text-destructive">{error}</div>
                ) : answer !== null ? (
                  <Markdown className="mt-3" content={answer} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="pb-6">
            <Card className="mx-auto w-full max-w-3xl">
              <CardContent className="relative p-4">
                <textarea
                  className={cn(
                    "min-h-20 w-full resize-none rounded-lg border bg-transparent px-4 py-3 pr-14",
                    "text-base placeholder:text-muted-foreground/60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "ring-offset-background",
                  )}
                  placeholder="你可以问我关于知识库中的任何问题..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
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
                      variant={canSend ? "default" : "secondary"}
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
