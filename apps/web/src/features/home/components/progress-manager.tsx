"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProgressTaskStatus = "running" | "success" | "cancelled" | "error";

export type ProgressTask = {
  id: string;
  label: string;
  progress: number; // 0-100
  status: ProgressTaskStatus;
  pageId?: string;
};

function ProgressBar(props: { value: number }) {
  const value = Math.max(0, Math.min(100, props.value));
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className="h-1.5 rounded-full bg-primary transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ProgressManager(props: {
  tasks: ProgressTask[];
  onCancelTask: (taskId: string) => void;
  onPreviewTask: (taskId: string) => void;
}) {
  const tasks = props.tasks;
  if (!tasks.length) return null;

  const doneCount = tasks.filter((t) => t.status !== "running").length;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-primary/15" aria-hidden />
          <div className="text-sm font-medium">进程管理器</div>
          <div className="text-sm text-muted-foreground">
            {doneCount}/{tasks.length}
          </div>
        </div>
      </div>

      <div className="max-h-60 overflow-auto px-4 py-3">
        <div className="space-y-3">
          {tasks.map((t) => {
            const isRunning = t.status === "running";
            const isSuccess = t.status === "success";
            const isCancelled = t.status === "cancelled";
            const isError = t.status === "error";

            return (
              <div key={t.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.label}</div>
                    <div className="mt-2">
                      <ProgressBar value={t.progress} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {isRunning
                        ? "上传中…"
                        : isSuccess
                          ? "已完成"
                          : isCancelled
                            ? "已取消"
                            : isError
                              ? "失败"
                              : ""}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isRunning ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => props.onCancelTask(t.id)}
                      >
                        取消
                      </Button>
                    ) : null}

                    {isSuccess ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full",
                            "bg-primary/15 text-primary",
                          )}
                          aria-label="完成"
                          title="完成"
                        >
                          ✓
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => props.onPreviewTask(t.id)}
                        >
                          预览
                        </Button>
                      </div>
                    ) : null}

                    {isCancelled || isError ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        disabled
                      >
                        预览
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
