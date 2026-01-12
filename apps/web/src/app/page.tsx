"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { TreeNode } from "@/components/common/tree";
import {
  parseContentToSlateValue,
  serializeSlateValue,
  type SlateValue,
} from "@/components/common/slate-editor";
import { cn } from "@/lib/utils";
import { importsApi, pagesApi, tasksApi, type ApiTaskDto, type PageDto } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api/client";
import { buildPageTreeFromFlatPages } from "@contexta/shared";
import type { PageVersionDto, PageVersionStatus } from "@/lib/api/pages/types";

import { DeleteConfirmDialog } from "@/features/home/components/delete-confirm-dialog";
import { MainContent } from "@/features/home/components/main-content";
import { Sidebar } from "@/features/home/components/sidebar";
import { PageTopbar } from "@/features/home/components/topbar";
import { ImportPageModal } from "@/features/home/components/import-page-modal";
import { ProgressManager, type ProgressTask } from "@/features/home/components/progress-manager";
import type { Selected, ViewId } from "@/features/home/types";

export default function HomePage() {
  return <HomeScreen />;
}

export function HomeScreen(props: {
  initialSelectedPageId?: string;
  initialSelectedViewId?: ViewId;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Selected>(() => {
    if (props.initialSelectedPageId) {
      return { kind: "page", id: props.initialSelectedPageId, title: "" };
    }

    if (props.initialSelectedViewId) {
      return { kind: "view", id: props.initialSelectedViewId };
    }

    return { kind: "view", id: "dashboard" };
  });

  const selectedPageId = selected.kind === "page" ? selected.id : null;

  useEffect(() => {
    if (selected.kind === "page") {
      const target = `/pages/${encodeURIComponent(selected.id)}`;
      if (pathname !== target) router.replace(target);
      return;
    }

    const target =
      selected.id === "dashboard" ? "/" : selected.id === "settings" ? "/settings" : "/notion-ai";
    if (pathname !== target) router.replace(target);
  }, [pathname, router, selected]);

  const [activePage, setActivePage] = useState<PageDto | null>(null);
  const [pageMode, setPageMode] = useState<"edit" | "preview">("preview");
  const [publishedSnapshot, setPublishedSnapshot] = useState<{
    title: string;
    content: unknown;
    updatedBy: string;
    updatedAt: string;
  } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<SlateValue>(() =>
    parseContentToSlateValue(""),
  );
  const [pageSaving, setPageSaving] = useState(false);
  const [pagePublishing, setPagePublishing] = useState(false);
  const [pageVersions, setPageVersions] = useState<PageVersionDto[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const lastSavedRef = useRef<{ id: string; title: string; contentKey: string } | null>(null);

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
  const [openPageMore, setOpenPageMore] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [tasks, setTasks] = useState<ProgressTask[]>([]);
  const taskRuntimeRef = useRef<
    Map<string, { upload?: AbortController; sse?: EventSource }>
  >(new Map());
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

  function stripFileExt(name: string) {
    const trimmed = (name ?? "").trim();
    const dot = trimmed.lastIndexOf(".");
    if (dot <= 0) return trimmed || "无标题文档";
    return trimmed.slice(0, dot) || "无标题文档";
  }

  function createTaskId() {
    try {
      return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }

  function updateTask(taskId: string, patch: Partial<ProgressTask>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  function replaceTaskId(oldId: string, newId: string) {
    setTasks((prev) => prev.map((t) => (t.id === oldId ? { ...t, id: newId } : t)));

    const runtime = taskRuntimeRef.current.get(oldId);
    if (runtime) {
      taskRuntimeRef.current.delete(oldId);
      taskRuntimeRef.current.set(newId, runtime);
    }
  }

  function closeTaskSse(taskId: string) {
    const runtime = taskRuntimeRef.current.get(taskId);
    runtime?.sse?.close();
    if (runtime) {
      delete runtime.sse;
    }
  }

  function cleanupTaskRuntime(taskId: string) {
    const runtime = taskRuntimeRef.current.get(taskId);
    runtime?.upload?.abort();
    runtime?.sse?.close();
    taskRuntimeRef.current.delete(taskId);
  }

  function mapApiStatus(status: ApiTaskDto["status"]): ProgressTask["status"] {
    switch (status) {
      case "PENDING":
      case "RUNNING":
        return "running";
      case "SUCCEEDED":
        return "success";
      case "CANCELLED":
        return "cancelled";
      case "FAILED":
      default:
        return "error";
    }
  }

  function extractPageIdFromResult(result: unknown): string | undefined {
    if (!result || typeof result !== "object") return undefined;
    if (!("pageId" in result)) return undefined;
    const value = (result as { pageId?: unknown }).pageId;
    return typeof value === "string" ? value : undefined;
  }

  function subscribeTaskEvents(taskId: string) {
    const url = `${getApiBaseUrl()}/tasks/${encodeURIComponent(taskId)}/events`;
    const es = new EventSource(url);

    const runtime = taskRuntimeRef.current.get(taskId) ?? {};
    runtime.sse = es;
    taskRuntimeRef.current.set(taskId, runtime);

    es.onmessage = (evt) => {
      try {
        const apiTask = JSON.parse(evt.data) as ApiTaskDto;
        const nextStatus = mapApiStatus(apiTask.status);
        const nextProgress = Math.max(0, Math.min(100, Math.trunc(apiTask.progress ?? 0)));
        const pageId = extractPageIdFromResult(apiTask.result);

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              progress: Math.max(t.progress, nextProgress),
              status: nextStatus,
              pageId: pageId ?? t.pageId,
            };
          }),
        );

        if (apiTask.status === "SUCCEEDED" && pageId) {
          void refreshPages();
        }

        if (apiTask.status === "SUCCEEDED" || apiTask.status === "FAILED" || apiTask.status === "CANCELLED") {
          closeTaskSse(taskId);
        }
      } catch {
        // ignore malformed SSE payload
      }
    };

    es.onerror = () => {
      // 连接失败/断开时：标记失败并关闭连接，避免无限重连造成噪音。
      updateTask(taskId, { status: "error" });
      closeTaskSse(taskId);
    };
  }

  async function startImportMarkdown(file: File) {
    const localId = createTaskId();
    const upload = new AbortController();
    taskRuntimeRef.current.set(localId, { upload });

    setTasks((prev) => [
      {
        id: localId,
        label: file.name,
        progress: 0,
        status: "running",
      },
      ...prev,
    ]);

    try {
      const title = stripFileExt(file.name);

      const res = await importsApi.createMarkdown(
        { file, title },
        {
          signal: upload.signal,
          onUploadProgress: (pct) => {
            // 仅展示上传阶段的进度（0-20），后续由后端 SSE 驱动。
            updateTask(localId, { progress: Math.round((pct / 100) * 20) });
          },
        },
      );

      const serverTaskId = res.taskId;
      replaceTaskId(localId, serverTaskId);

      // 上传结束后，进入后端任务阶段。
      updateTask(serverTaskId, { progress: 20 });
      subscribeTaskEvents(serverTaskId);
    } catch (e: unknown) {
      const isAbort =
        typeof e === "object" &&
        e !== null &&
        "name" in e &&
        (e as { name?: unknown }).name === "AbortError";

      updateTask(localId, { status: isAbort ? "cancelled" : "error" });
      cleanupTaskRuntime(localId);
    }
  }

  function handleCancelTask(taskId: string) {
    const runtime = taskRuntimeRef.current.get(taskId);
    runtime?.upload?.abort();
    runtime?.sse?.close();

    updateTask(taskId, { status: "cancelled" });

    // 如果已经拿到后端 taskId，则通知后端取消。
    void (async () => {
      try {
        await tasksApi.cancel(taskId);
      } catch {
        // ignore
      }
    })();
  }

  async function handlePreviewTask(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    const pageId = task?.pageId;
    if (!pageId) return;

    await refreshPages();
    setSelected({ kind: "page", id: pageId, title: "" });
  }

  useEffect(() => {
    const runtimeMap = taskRuntimeRef.current;
    return () => {
      for (const [, runtime] of runtimeMap) {
        runtime.upload?.abort();
        runtime.sse?.close();
      }
      runtimeMap.clear();
    };
  }, []);

  useEffect(() => {
    setOpenPageMore(false);
    if (!selectedPageId) {
      setActivePage(null);
      setLastSavedAt(null);
      setPageVersions([]);
      setPublishedSnapshot(null);
      setPageMode("preview");
      return;
    }

    let cancelled = false;
    setPageLoading(true);

    (async () => {
      try {
        const page = await pagesApi.get(selectedPageId);
        if (cancelled) return;
        setActivePage(page);
        setPageMode("preview");
        setPublishedSnapshot(null);
        setPageTitle(page.title);
        setLastSavedAt(formatTime(page.updatedAt));
        const loadedValue = parseContentToSlateValue(page.content);
        setEditorValue(loadedValue);
        lastSavedRef.current = {
          id: page.id,
          title: page.title,
          contentKey: serializeSlateValue(loadedValue),
        };

        // 默认进入预览：优先展示最新已发布内容。
        try {
          const published = await pagesApi.getLatestPublished(page.id);
          if (cancelled) return;
          setPublishedSnapshot({
            title: published.title,
            content: published.content,
            updatedBy: published.updatedBy,
            updatedAt: published.updatedAt,
          });
        } catch {
          // 没有已发布版本时保持 preview，但不额外做 UI。
        }
      } finally {
        if (cancelled) return;
        setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPageId]);

  useEffect(() => {
    if (pageMode !== "edit") return;
    if (!activePage) return;

    let cancelled = false;
    setVersionsLoading(true);

    (async () => {
      try {
        const versions = await pagesApi.listVersions(activePage.id);
        if (cancelled) return;
        setPageVersions(versions);
      } finally {
        if (cancelled) return;
        setVersionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePage, pageMode]);

  function statusLabel(status: PageVersionStatus) {
    switch (status) {
      case "DRAFT":
        return "草稿";
      case "TEMP":
        return "临时";
      case "PUBLISHED":
        return "已发布";
      default:
        return status;
    }
  }

  const editorContentKey = useMemo(() => serializeSlateValue(editorValue), [editorValue]);

  useEffect(() => {
    if (pageMode !== "edit") return;
    if (!activePage) return;

    const currentId = activePage.id;
    const nextTitle = pageTitle.trim() || "无标题文档";
    const nextContentKey = editorContentKey;
    const lastSaved = lastSavedRef.current;

    if (lastSaved?.id === currentId && lastSaved.title === nextTitle && lastSaved.contentKey === nextContentKey) {
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setPageSaving(true);
        const saved = await pagesApi.save(currentId, {
          title: nextTitle,
          content: editorValue,
        });

        setLastSavedAt(formatTime(saved.updatedAt));

        const savedValue = parseContentToSlateValue(saved.content);

        lastSavedRef.current = {
          id: saved.id,
          title: saved.title,
          contentKey: serializeSlateValue(savedValue),
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
  }, [activePage, pageMode, pageTitle, editorContentKey, editorValue, selected]);

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

  async function handlePublish() {
    if (!activePage || pagePublishing) return;
    try {
      setPagePublishing(true);
      await pagesApi.publish(activePage.id);
      const published = await pagesApi.getLatestPublished(activePage.id);
      setPublishedSnapshot({
        title: published.title,
        content: published.content,
        updatedBy: published.updatedBy,
        updatedAt: published.updatedAt,
      });
      setPageMode("preview");
    } finally {
      setPagePublishing(false);
    }
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <Sidebar<PageDto>
        selected={selected}
        onSelectView={(id: ViewId) => setSelected({ kind: "view", id })}
        onSelectPage={(id, title) => setSelected({ kind: "page", id, title })}
        nodes={pageTreeNodes}
        pagesLoaded={pagesLoaded}
        creatingPage={creatingPage}
        renamingTargetId={renamingTarget?.id ?? null}
        renamingValue={renamingValue}
        savingRename={savingRename}
        openMenuNodeId={openMenuNodeId}
        onCreatePage={handleCreatePage}
        onOpenImport={() => setOpenImportModal(true)}
        onCreateChildPage={handleCreateChildPage}
        onToggleNodeMenu={setOpenMenuNodeId}
        onRenameStart={(id, title) => {
          setRenamingTarget({ id, title });
          setRenamingValue(title);
        }}
        onRenameValueChange={setRenamingValue}
        onRenameCommit={handleSaveRename}
        onRenameCancel={() => setRenamingTarget(null)}
        onDeleteRequest={(id, title) => setDeleteTarget({ id, title })}
      />

      <main className="flex-1 overflow-auto" aria-live="polite">
        <PageTopbar
          visible={selected.kind === "page"}
          pageMode={pageMode}
          activePageExists={!!activePage}
          pageTitle={pageTitle}
          publishedTitle={publishedSnapshot?.title ?? null}
          pageLoading={pageLoading}
          pageSaving={pageSaving}
          pagePublishing={pagePublishing}
          lastSavedAt={lastSavedAt}
          openMore={openPageMore}
          setOpenMore={setOpenPageMore}
          onCloseEdit={() => {
            if (!activePage) return;
            setPageMode("preview");
          }}
          onEnterEdit={() => setPageMode("edit")}
          onPublish={handlePublish}
          onOpenHistory={() => {
            if (!selectedPageId) return;
            router.push(`/page/${encodeURIComponent(selectedPageId)}/versions`);
          }}
        />

        <div className={cn("px-6 lg:px-11", selected.kind === "page" ? "py-6" : "py-10")}>
          <MainContent
            selected={selected}
            pageMode={pageMode}
            activePageId={activePage?.id ?? null}
            publishedSnapshot={publishedSnapshot}
            pageTitle={pageTitle}
            pageLoading={pageLoading}
            editorValue={editorValue}
            onEditorChange={setEditorValue}
            onTitleChange={setPageTitle}
            dashboardCards={dashboardCards}
            templateCards={templateCards}
            versionsLoading={versionsLoading}
            pageVersions={pageVersions}
            statusLabel={statusLabel}
            formatTime={formatTime}
            formatYmd={formatYmd}
          />
        </div>
      </main>

      <DeleteConfirmDialog
        target={deleteTarget}
        deleting={deletingPage}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImportPageModal
        open={openImportModal}
        onOpenChange={setOpenImportModal}
        onPickMarkdownFile={(file) => {
          void startImportMarkdown(file);
        }}
      />

      <ProgressManager
        tasks={tasks}
        onCancelTask={handleCancelTask}
        onPreviewTask={(id) => {
          void handlePreviewTask(id);
        }}
      />
    </div>
  );
}
