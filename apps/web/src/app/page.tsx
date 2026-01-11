"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Tree, type TreeNode } from "@/components/common/tree";
import {
  parseContentToSlateValue,
  serializeSlateValue,
  SlateEditor,
  type SlateValue,
} from "@/components/common/slate-editor";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { pagesApi, type PageDto } from "@/lib/api";
import { buildPageTreeFromFlatPages } from "@contexta/shared";

type ViewId = "dashboard" | "notion-ai" | "settings";

type Selected =
  | { kind: "view"; id: ViewId }
  | { kind: "page"; id: string; title: string };

function SidebarItem(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-9 w-full justify-start gap-2 px-2",
        props.active && "bg-accent text-accent-foreground",
      )}
      onClick={props.onClick}
    >
      <span className="truncate">{props.label}</span>
    </Button>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-muted-foreground">{props.title}</div>
      <div>{props.children}</div>
    </section>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Selected>({
    kind: "view",
    id: "dashboard",
  });

  const [activePage, setActivePage] = useState<PageDto | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<SlateValue>(() =>
    parseContentToSlateValue(""),
  );
  const [pageSaving, setPageSaving] = useState(false);
  const lastSavedRef = useRef<{ id: string; title: string; content: string } | null>(null);

  function formatTime(value: string | Date) {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const dashboardCards = [
    { title: "新页面", meta: "2 小时前" },
    { title: "Getting Started", meta: "2022 年 5 月 19 日" },
    { title: "新数据库", meta: "2025 年 5 月 6 日" },
    { title: "新建页面", meta: "", disabled: true },
  ];

  const templateCards = [
    { title: "项目规划" },
    { title: "会议纪要" },
    { title: "周报" },
  ];

  const [pageTreeNodes, setPageTreeNodes] = useState<TreeNode<PageDto>[]>([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [openMenuNodeId, setOpenMenuNodeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletingPage, setDeletingPage] = useState(false);
  const [renamingTarget, setRenamingTarget] = useState<{ id: string; title: string } | null>(null);
  const [renamingValue, setRenamingValue] = useState<string>("");
  const [savingRename, setSavingRename] = useState(false);

  async function refreshPages() {
    try {
      const pages = await pagesApi.list();
      setPageTreeNodes(buildPageTreeFromFlatPages(pages));
    } finally {
      setPagesLoaded(true);
    }
  }

  useEffect(() => {
    if (selected.kind !== "page") {
      setActivePage(null);
      setLastSavedAt(null);
      return;
    }

    let cancelled = false;
    setPageLoading(true);

    (async () => {
      try {
        const page = await pagesApi.get(selected.id);
        if (cancelled) return;
        setActivePage(page);
        setPageTitle(page.title);
        setLastSavedAt(formatTime(page.updatedAt));
        setEditorValue(parseContentToSlateValue(page.content));
        lastSavedRef.current = {
          id: page.id,
          title: page.title,
          content: page.content,
        };
      } finally {
        if (cancelled) return;
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected.kind, selected.kind === "page" ? selected.id : null]);

  const editorContentString = useMemo(() => serializeSlateValue(editorValue), [editorValue]);

  useEffect(() => {
    if (!activePage) return;

    const currentId = activePage.id;
    const nextTitle = pageTitle.trim() || "无标题文档";
    const nextContent = editorContentString;
    const lastSaved = lastSavedRef.current;

    if (lastSaved?.id === currentId && lastSaved.title === nextTitle && lastSaved.content === nextContent) {
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setPageSaving(true);
        const saved = await pagesApi.save(currentId, {
          title: nextTitle,
          content: nextContent,
        });

        setLastSavedAt(formatTime(saved.updatedAt));

        lastSavedRef.current = {
          id: saved.id,
          title: saved.title,
          content: saved.content,
        };

        setActivePage(saved);

        if (selected.kind === "page" && selected.id === saved.id && selected.title !== saved.title) {
          setSelected({ kind: "page", id: saved.id, title: saved.title });
          await refreshPages();
        }
      } finally {
        setPageSaving(false);
      }
    }, 2000);

    return () => {
      window.clearTimeout(handle);
    };
  }, [activePage, pageTitle, editorContentString, selected]);

  useEffect(() => {
    if (!openMenuNodeId) return;

    const onPointerDown = () => {
      setOpenMenuNodeId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openMenuNodeId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pages = await pagesApi.list();
        if (cancelled) return;
        setPageTreeNodes(buildPageTreeFromFlatPages(pages));
      } catch {
        if (cancelled) return;
        // 最小改动：请求失败时不做额外 UI。
        setPageTreeNodes([]);
      } finally {
        if (cancelled) return;
        setPagesLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreatePage() {
    if (creatingPage) return;
    try {
      setCreatingPage(true);
      const page = await pagesApi.create({ title: "无标题文档" });
      setSelected({ kind: "page", id: page.id, title: page.title });
      await refreshPages();
    } finally {
      setCreatingPage(false);
    }
  }

  async function handleCreateChildPage(parent: TreeNode<PageDto>) {
    if (creatingPage) return;
    const parentIds = [...(parent.data?.parentIds ?? []), parent.id];
    try {
      setCreatingPage(true);
      const page = await pagesApi.create({ title: "无标题文档", parentIds });
      setSelected({ kind: "page", id: page.id, title: page.title });
      await refreshPages();
    } finally {
      setCreatingPage(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deletingPage) return;

    try {
      setDeletingPage(true);
      await pagesApi.remove(deleteTarget.id);

      if (selected.kind === "page" && selected.id === deleteTarget.id) {
        setSelected({ kind: "view", id: "dashboard" });
      }

      await refreshPages();
      setDeleteTarget(null);
    } finally {
      setDeletingPage(false);
    }
  }

  async function handleSaveRename() {
    if (!renamingTarget || savingRename) return;

    const nextTitle = renamingValue.trim() || "无标题文档";

    try {
      setSavingRename(true);
      const page = await pagesApi.save(renamingTarget.id, { title: nextTitle });

      if (selected.kind === "page" && selected.id === page.id) {
        setSelected({ kind: "page", id: page.id, title: page.title });
      }

      await refreshPages();
      setRenamingTarget(null);
    } finally {
      setSavingRename(false);
    }
  }

  function renderMain() {
    if (selected.kind === "view" && selected.id === "dashboard") {
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
              {dashboardCards.map((c) => (
                <Card
                  key={c.title}
                  className={cn(
                    "cursor-default select-none transition-colors",
                    c.disabled && "opacity-60",
                  )}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="truncate text-sm">{c.title}</CardTitle>
                    {c.meta ? (
                      <CardDescription className="text-xs">{c.meta}</CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="模版">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {templateCards.map((c) => (
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

    if (selected.kind === "page") {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-4 pt-6">
          <div className="space-y-2">
            <input
              className={cn(
                "w-full bg-transparent text-5xl font-bold tracking-tight",
                "placeholder:text-muted-foreground/40",
                "focus-visible:outline-none",
              )}
              placeholder="请输入标题"
              value={pageTitle}
              disabled={pageLoading}
              onChange={(e) => setPageTitle(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <SlateEditor
              key={activePage?.id ?? selected.id}
              value={editorValue}
              onChange={setEditorValue}
              disabled={pageLoading}
              placeholder="直接输入正文…"
            />
          </div>
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
        <div className="text-2xl font-bold tracking-tight">{titleById[selected.id]}</div>
        <div className="text-sm text-muted-foreground">该区域会随左侧选中项变化。</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="w-72 border-r bg-muted/30">
        <div className="flex h-dvh flex-col gap-4 overflow-auto p-3">
          <SidebarItem
            label="仪表盘"
            active={selected.kind === "view" && selected.id === "dashboard"}
            onClick={() => setSelected({ kind: "view", id: "dashboard" })}
          />

          <SidebarItem
            label="Notion AI"
            active={selected.kind === "view" && selected.id === "notion-ai"}
            onClick={() => setSelected({ kind: "view", id: "notion-ai" })}
          />

          <Separator />

          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start px-2 text-xs font-medium tracking-wide text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
          >
            页面
          </Button>

          {pagesLoaded && pageTreeNodes.length === 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full justify-start px-2"
              disabled={creatingPage}
              onClick={handleCreatePage}
            >
              新建
            </Button>
          ) : (
            <Tree
              nodes={pageTreeNodes}
              selectedId={selected.kind === "page" ? selected.id : undefined}
              renderNode={({
                node,
                depth,
                selected: isSelected,
                hasChildren,
                expanded,
                toggleExpanded,
              }) => {
                const isRenaming = renamingTarget?.id === node.id;

                return (
                  <div
                    className="group flex items-center"
                    style={{ paddingLeft: 8 + depth * 14 }}
                  >
                  {hasChildren ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mr-1 h-7 w-7 px-0 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                      }}
                      aria-label={expanded ? "收起" : "展开"}
                      aria-expanded={expanded}
                    >
                      {expanded ? "▾" : "▸"}
                    </Button>
                  ) : (
                    <span className="mr-1 h-7 w-7" aria-hidden="true" />
                  )}

                  {isRenaming ? (
                    <input
                      className={cn(
                        "h-9 w-full flex-1 rounded-md border bg-background px-2 text-sm",
                        "border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      )}
                      value={renamingValue}
                      autoFocus
                      disabled={savingRename}
                      onChange={(e) => setRenamingValue(e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveRename();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          e.stopPropagation();
                          setRenamingTarget(null);
                        }
                      }}
                      onBlur={() => setRenamingTarget(null)}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-9 w-full flex-1 justify-start px-2",
                        isSelected && "bg-accent text-accent-foreground",
                      )}
                      onClick={() =>
                        setSelected({ kind: "page", id: node.id, title: node.label })
                      }
                    >
                      <span className="truncate">{node.label}</span>
                    </Button>
                  )}

                  {!isRenaming ? (
                    <div
                      className={cn(
                        "ml-1 flex items-center gap-0.5",
                        "opacity-0 transition-opacity group-hover:opacity-100",
                      )}
                    >
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 px-0 text-muted-foreground"
                      aria-label="新建子页面"
                      disabled={creatingPage}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateChildPage(node);
                      }}
                    >
                      +
                    </Button>

                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 px-0 text-muted-foreground"
                        aria-label="更多"
                        aria-expanded={openMenuNodeId === node.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setOpenMenuNodeId((prev) => (prev === node.id ? null : node.id));
                        }}
                      >
                        …
                      </Button>

                      {openMenuNodeId === node.id ? (
                        <div
                          className={cn(
                            "absolute right-0 top-8 z-50 w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground",
                          )}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-full justify-start rounded-none px-2"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuNodeId(null);
                              setSelected({ kind: "page", id: node.id, title: node.label });
                              setRenamingTarget({ id: node.id, title: node.label });
                              setRenamingValue(node.label);
                            }}
                          >
                            重命名
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-full justify-start rounded-none px-2 text-destructive"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuNodeId(null);
                              setDeleteTarget({ id: node.id, title: node.label });
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    </div>
                  ) : null}
                  </div>
                );
              }}
            />
          )}

          <Separator />

          <SidebarItem
            label="设置"
            active={selected.kind === "view" && selected.id === "settings"}
            onClick={() => setSelected({ kind: "view", id: "settings" })}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-auto" aria-live="polite">
        {selected.kind === "page" ? (
          <div className="sticky top-0 z-20 border-b bg-background">
            <div className="flex h-12 items-center justify-between px-6 lg:px-11">
              <div className="flex min-w-0 items-center">
                <div className="truncate text-sm font-medium">
                  {pageTitle.trim() || "无标题文档"}
                </div>
                <div className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {pageLoading
                    ? "加载中…"
                    : pageSaving
                      ? "保存中…"
                      : lastSavedAt
                        ? `已保存 ${lastSavedAt}`
                        : ""}
                </div>
              </div>

              <Button type="button" variant="default" size="sm">
                保存
              </Button>
            </div>
          </div>
        ) : null}

        <div className={cn("px-6 lg:px-11", selected.kind === "page" ? "py-6" : "py-10")}>
          {renderMain()}
        </div>
      </main>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="删除确认"
          onPointerDown={() => {
            if (deletingPage) return;
            setDeleteTarget(null);
          }}
        >
          <div onPointerDown={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>确认删除？</CardTitle>
                <CardDescription>
                  将删除“{deleteTarget.title}”，此操作无法撤销。
                </CardDescription>
              </CardHeader>

              <div className="flex items-center justify-end gap-2 px-6 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={deletingPage}
                  onClick={() => setDeleteTarget(null)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={deletingPage}
                  onClick={handleConfirmDelete}
                >
                  删除
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
