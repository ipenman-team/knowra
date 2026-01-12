import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlateEditor, parseContentToSlateValue, type SlateValue } from "@/components/common/slate-editor";
import { cn } from "@/lib/utils";
import type { PageVersionDto, PageVersionStatus } from "@/lib/api/pages/types";

import { Section } from "./section";
import type { Selected, ViewId } from "../types";

export function MainContent(props: {
  selected: Selected;
  pageMode: "edit" | "preview";
  activePageId: string | null;
  publishedSnapshot: {
    title: string;
    content: unknown;
    updatedBy: string;
    updatedAt: string;
  } | null;
  pageTitle: string;
  pageLoading: boolean;
  editorValue: SlateValue;
  onEditorChange: (value: SlateValue) => void;
  onTitleChange: (value: string) => void;
  dashboardCards: Array<{ title: string; meta: string; disabled?: boolean }>;
  templateCards: Array<{ title: string }>;
  versionsLoading: boolean;
  pageVersions: PageVersionDto[];
  statusLabel: (status: PageVersionStatus) => string;
  formatTime: (value: string | Date) => string;
  formatYmd: (value: string | Date) => string;
}) {
  if (props.selected.kind === "view" && props.selected.id === "dashboard") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="pt-2 text-4xl font-bold tracking-tight">晚上好呀</div>

        <Section title="指南">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>从这里开始</CardTitle>
              <CardDescription>
                在左侧选择不同入口，右侧内容会随之变化。这里是仪表盘页的简介与指南区域。
              </CardDescription>
            </CardHeader>
          </Card>
        </Section>

        <Section title="最近访问">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {props.dashboardCards.map((c) => (
              <Card
                key={c.title}
                className={cn("cursor-default select-none transition-colors", c.disabled && "opacity-60")}
              >
                <CardHeader className="p-4">
                  <CardTitle className="truncate text-sm">{c.title}</CardTitle>
                  {c.meta ? <CardDescription className="text-xs">{c.meta}</CardDescription> : null}
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="模版">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {props.templateCards.map((c) => (
              <Card key={c.title} className="cursor-default select-none">
                <CardHeader className="p-4">
                  <CardTitle className="truncate text-sm">{c.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  if (props.selected.kind === "page") {
    const isPreview = props.pageMode === "preview";
    const previewTitle = props.publishedSnapshot?.title ?? props.pageTitle;
    const previewValue = isPreview
      ? props.publishedSnapshot
        ? parseContentToSlateValue(props.publishedSnapshot.content)
        : props.editorValue
      : props.editorValue;

    const previewEditorKey = `${props.activePageId ?? props.selected.id}-preview-${props.activePageId ? "loaded" : "loading"}-${props.publishedSnapshot?.updatedAt ?? "none"}`;
    const editEditorKey = `${props.activePageId ?? props.selected.id}-edit`;

    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 pt-6">
        <div className="space-y-2">
          {isPreview ? (
            <div className="text-5xl font-bold tracking-tight">{previewTitle.trim() || "无标题文档"}</div>
          ) : (
            <input
              className={cn(
                "w-full bg-transparent text-5xl font-bold tracking-tight",
                "placeholder:text-muted-foreground/40",
                "focus-visible:outline-none",
              )}
              placeholder="请输入标题"
              value={props.pageTitle}
              disabled={props.pageLoading}
              onChange={(e) => props.onTitleChange(e.target.value)}
            />
          )}
        </div>

        <div className="pt-2">
          <SlateEditor
            key={isPreview ? previewEditorKey : editEditorKey}
            value={previewValue}
            onChange={props.onEditorChange}
            disabled={props.pageLoading}
            readOnly={isPreview}
            showToolbar={!isPreview}
            placeholder={isPreview ? undefined : "直接输入正文…"}
          />
        </div>

        {!isPreview ? (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">版本历史</CardTitle>
              <CardDescription className="text-xs">
                {props.versionsLoading
                  ? "加载中…"
                  : props.pageVersions.length
                    ? `共 ${props.pageVersions.length} 条`
                    : "暂无版本"}
              </CardDescription>
            </CardHeader>

            {props.pageVersions.length ? (
              <div className="space-y-2 px-4 pb-4">
                {props.pageVersions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {props.statusLabel(v.status)} · {v.title || "无标题文档"}
                      </div>
                      <div className="text-xs text-muted-foreground">{props.formatTime(v.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        {isPreview && props.publishedSnapshot ? (
          <div className="pt-2 text-sm text-muted-foreground">
            最后更新人：{props.publishedSnapshot.updatedBy || "-"} · 更新时间：
            {props.formatYmd(props.publishedSnapshot.updatedAt)}
          </div>
        ) : null}
      </div>
    );
  }

  const titleById: Record<ViewId, string> = {
    dashboard: "仪表盘",
    "notion-ai": "Notion AI",
    settings: "设置",
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-2 pt-6">
      <div className="text-2xl font-bold tracking-tight">{titleById[props.selected.id]}</div>
      <div className="text-sm text-muted-foreground">该区域会随左侧选中项变化。</div>
    </div>
  );
}
