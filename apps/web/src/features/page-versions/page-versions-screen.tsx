"use client";

import { useEffect, useMemo, useState } from "react";

import { parseContentToSlateValue, SlateEditor } from "@/components/shared/slate-editor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pagesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PageVersionDetailDto, PageVersionDto } from "@/lib/api/pages/types";
import { useCurrentSpaceId } from "@/stores";

function formatTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatYmd(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PageVersionsScreen(props: { pageId: string }) {
  const pageId = props.pageId;
  const spaceId = useCurrentSpaceId();

  const [versions, setVersions] = useState<PageVersionDto[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const [detail, setDetail] = useState<PageVersionDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    let cancelled = false;
    setVersionsLoading(true);

    (async () => {
      try {
        const list = spaceId
          ? await pagesApi.listVersions(spaceId, pageId)
          : await pagesApi.listVersions(pageId);
        if (cancelled) return;
        setVersions(list);
        setSelectedVersionId((prev) => prev ?? list[0]?.id ?? null);
      } finally {
        if (cancelled) return;
        setVersionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageId, spaceId]);

  useEffect(() => {
    if (!pageId || !selectedVersionId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    (async () => {
      try {
        const res = spaceId
          ? await pagesApi.getVersion(spaceId, pageId, selectedVersionId)
          : await pagesApi.getVersion(pageId, selectedVersionId);
        if (cancelled) return;
        setDetail(res);
      } finally {
        if (cancelled) return;
        setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageId, selectedVersionId, spaceId]);

  const editorValue = useMemo(() => {
    if (!detail) return parseContentToSlateValue("");
    return parseContentToSlateValue(detail.content);
  }, [detail]);

  const title = detail?.title?.trim() || "无标题文档";

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="w-72 border-r bg-muted/30">
        <div className="flex h-dvh flex-col gap-3 overflow-auto p-3">
          <div className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            历史版本
          </div>
          <Separator />

          {versionsLoading ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">加载中…</div>
          ) : versions.length ? (
            <div className="space-y-1">
              {versions.map((v) => {
                const active = v.id === selectedVersionId;
                return (
                  <Button
                    key={v.id}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-auto w-full justify-start px-2 py-2 text-left",
                      active && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => setSelectedVersionId(v.id)}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{v.title || "无标题文档"}</div>
                      <div
                        className={cn(
                          "mt-0.5 text-xs",
                          active ? "text-accent-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {formatYmd(v.createdAt)} {formatTime(v.createdAt)}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="px-2 py-2 text-sm text-muted-foreground">暂无版本</div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-12 items-center px-6 lg:px-11">
            <div className="truncate text-sm font-medium">{detail ? title : "历史版本"}</div>
            {detailLoading ? <div className="ml-3 text-xs text-muted-foreground">加载中…</div> : null}
          </div>
        </div>

        <div className="px-6 py-6 lg:px-11">
          {detail ? (
            <div className="mx-auto w-full max-w-5xl space-y-4 pt-6">
              <div className="space-y-2">
                <div className="text-5xl font-bold tracking-tight">{title}</div>
              </div>

              <div className="pt-2">
                <SlateEditor
                  key={detail.id}
                  value={editorValue}
                  onChange={() => {
                    // readOnly
                  }}
                  disabled={detailLoading}
                  readOnly
                  showToolbar={false}
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-5xl pt-6 text-sm text-muted-foreground">
              {selectedVersionId ? "加载中…" : "请选择一个版本"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
