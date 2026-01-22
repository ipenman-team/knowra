'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { HomeLayout } from '@/components/layout';
import { PageSidebar } from '@/components/sidebar';
import { PageEditor } from '@/components/editor';
import { PageTopbar } from '@/features/home/components/topbar';
import { MainContent } from '@/features/home/components/main-content';
import { DeleteConfirmDialog } from '@/features/home/components/delete-confirm-dialog';
import { ImportPageModal } from '@/features/home/components/import-page-modal';
import { ProgressManager } from '@/features/home/components/progress-manager';

import {
  usePageSelectionStore,
  useSelectedPageId,
  useMeStore,
  usePageContentStore,
  usePageTreeStore,
  useUIStateStore,
  useTaskStore,
} from '@/stores';

import {
  useUrlSync,
  usePageLoader,
  usePublishedPageLoader,
  usePageAutoSave,
  useTaskSubscription,
} from '@/hooks';

import { pagesApi, importsApi, tasksApi } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import type { ViewId } from '@/features/home/types';

export function AppHome() {
  return <HomeScreen />;
}

export function HomeScreen(props: {
  initialSelectedPageId?: string;
  initialSelectedViewId?: ViewId;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();

  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);

  const urlPageId = (() => {
    if (!pathname.startsWith('/pages/')) return null;
    const rest = pathname.slice('/pages/'.length);
    const raw = rest.split('/')[0];
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const { setSelected } = usePageSelectionStore();
  const selected = usePageSelectionStore((s) => s.selected);
  const selectedPageId = useSelectedPageId();

  useEffect(() => {
    if (props.initialSelectedPageId) {
      setSelected({
        kind: 'page',
        id: props.initialSelectedPageId,
        title: '',
      });
    } else if (props.initialSelectedViewId) {
      setSelected({ kind: 'view', id: props.initialSelectedViewId });
    }
  }, [props.initialSelectedPageId, props.initialSelectedViewId, setSelected]);

  useEffect(() => {
    void ensureMeLoaded();
  }, [ensureMeLoaded]);

  useUrlSync();
  const isEditRoute = pathname.startsWith('/pages/') && pathname.endsWith('/edit');
  usePageLoader(urlPageId, {
    enabled: isEditRoute,
    mode: 'edit',
    loadPublishedSnapshot: false,
  });
  usePublishedPageLoader(urlPageId, { enabled: !isEditRoute });
  usePageAutoSave();
  const { subscribeTaskEvents } = useTaskSubscription();

  const openImportModal = useUIStateStore((s) => s.openImportModal);
  const { setOpenImportModal, deleteTarget, setDeleteTarget } = useUIStateStore();
  const deletingPage = useUIStateStore((s) => s.deletingPage);
  const setDeletingPage = useUIStateStore((s) => s.setDeletingPage);
  const openPageMore = useUIStateStore((s) => s.openPageMore);
  const setOpenPageMoreRaw = useUIStateStore((s) => s.setOpenPageMore);
  const setOpenPageMore = useCallback(
    (open: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof open === 'function' ? open(openPageMore) : open;
      setOpenPageMoreRaw(value);
    },
    [openPageMore, setOpenPageMoreRaw]
  );

  const pageMode = usePageContentStore((s) => s.pageMode);
  const activePage = usePageContentStore((s) => s.activePage);
  const pageTitle = usePageContentStore((s) => s.pageTitle);
  const publishedSnapshot = usePageContentStore((s) => s.publishedSnapshot);
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const pageSaving = usePageContentStore((s) => s.pageSaving);
  const pagePublishing = usePageContentStore((s) => s.pagePublishing);
  const lastSavedAt = usePageContentStore((s) => s.lastSavedAt);
  const editorValue = usePageContentStore((s) => s.editorValue);
  const pageVersions = usePageContentStore((s) => s.pageVersions);
  const versionsLoading = usePageContentStore((s) => s.versionsLoading);
  const { setPagePublishing, setEditorValue, setPageTitle } = usePageContentStore();

  const tasks = useTaskStore((s) => s.tasks);
  const { addTask, updateTask, replaceTaskId, cleanupAllRuntimes } = useTaskStore();

  const { setPageTreeNodes } = usePageTreeStore();
  const refreshPages = useCallback(async () => {
    const pages = await pagesApi.list();
    setPageTreeNodes(buildPageTreeFromFlatPages(pages));
  }, [setPageTreeNodes]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || deletingPage) return;

    try {
      setDeletingPage(true);
      await pagesApi.remove(deleteTarget.id);

      if (selected.kind === 'page' && selected.id === deleteTarget.id) {
        setSelected({ kind: 'view', id: 'dashboard' });
      }

      await refreshPages();
      setDeleteTarget(null);
    } finally {
      setDeletingPage(false);
    }
  }, [deleteTarget, deletingPage, selected, setDeletingPage, setSelected, refreshPages, setDeleteTarget]);

  const handlePublish = useCallback(async () => {
    if (!activePage || pagePublishing) return;
    try {
      setPagePublishing(true);
      await pagesApi.publish(activePage.id);
      router.push(`/pages/${encodeURIComponent(activePage.id)}`);
    } finally {
      setPagePublishing(false);
    }
  }, [activePage, pagePublishing, router, setPagePublishing]);

  const createTaskId = useCallback(() => {
    try {
      return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }, []);

  const stripFileExt = useCallback((name: string) => {
    const trimmed = (name ?? '').trim();
    const dot = trimmed.lastIndexOf('.');
    if (dot <= 0) return trimmed || '无标题文档';
    return trimmed.slice(0, dot) || '无标题文档';
  }, []);

  const startImportMarkdown = useCallback(
    async (file: File) => {
      const localId = createTaskId();
      const upload = new AbortController();
      useTaskStore.getState().setTaskRuntime(localId, { upload });

      addTask({
        id: localId,
        label: file.name,
        progress: 0,
        status: 'running',
      });

      try {
        const title = stripFileExt(file.name);

        const res = await importsApi.createMarkdown(
          { file, title },
          {
            signal: upload.signal,
            onUploadProgress: (pct) => {
              updateTask(localId, { progress: Math.round((pct / 100) * 20) });
            },
          }
        );

        const serverTaskId = res.taskId;
        replaceTaskId(localId, serverTaskId);
        updateTask(serverTaskId, { progress: 20 });
        subscribeTaskEvents(serverTaskId);
      } catch (e: unknown) {
        const isAbort =
          typeof e === 'object' &&
          e !== null &&
          'name' in e &&
          (e as { name?: unknown }).name === 'AbortError';

        updateTask(localId, { status: isAbort ? 'cancelled' : 'error' });
        useTaskStore.getState().cleanupTaskRuntime(localId);
      }
    },
    [createTaskId, stripFileExt, addTask, updateTask, replaceTaskId, subscribeTaskEvents]
  );

  const startImportPdf = useCallback(
    async (file: File) => {
      const localId = createTaskId();
      const upload = new AbortController();
      useTaskStore.getState().setTaskRuntime(localId, { upload });

      addTask({
        id: localId,
        label: file.name,
        progress: 0,
        status: 'running',
      });

      try {
        const title = stripFileExt(file.name);

        const res = await importsApi.createPdf(
          { file, title },
          {
            signal: upload.signal,
            onUploadProgress: (pct) => {
              updateTask(localId, { progress: Math.round((pct / 100) * 20) });
            },
          }
        );

        const serverTaskId = res.taskId;
        replaceTaskId(localId, serverTaskId);
        updateTask(serverTaskId, { progress: 20 });
        subscribeTaskEvents(serverTaskId);
      } catch (e: unknown) {
        const isAbort =
          typeof e === 'object' &&
          e !== null &&
          'name' in e &&
          (e as { name?: unknown }).name === 'AbortError';

        updateTask(localId, { status: isAbort ? 'cancelled' : 'error' });
        useTaskStore.getState().cleanupTaskRuntime(localId);
      }
    },
    [createTaskId, stripFileExt, addTask, updateTask, replaceTaskId, subscribeTaskEvents]
  );

  const startImportDocx = useCallback(
    async (file: File) => {
      const localId = createTaskId();
      const upload = new AbortController();
      useTaskStore.getState().setTaskRuntime(localId, { upload });

      addTask({
        id: localId,
        label: file.name,
        progress: 0,
        status: 'running',
      });

      try {
        const title = stripFileExt(file.name);

        const res = await importsApi.createDocx(
          { file, title },
          {
            signal: upload.signal,
            onUploadProgress: (pct) => {
              updateTask(localId, { progress: Math.round((pct / 100) * 20) });
            },
          }
        );

        const serverTaskId = res.taskId;
        replaceTaskId(localId, serverTaskId);
        updateTask(serverTaskId, { progress: 20 });
        subscribeTaskEvents(serverTaskId);
      } catch (e: unknown) {
        const isAbort =
          typeof e === 'object' &&
          e !== null &&
          'name' in e &&
          (e as { name?: unknown }).name === 'AbortError';

        updateTask(localId, { status: isAbort ? 'cancelled' : 'error' });
        useTaskStore.getState().cleanupTaskRuntime(localId);
      }
    },
    [createTaskId, stripFileExt, addTask, updateTask, replaceTaskId, subscribeTaskEvents]
  );

  const handleCancelTask = useCallback(
    (taskId: string) => {
      const runtime = useTaskStore.getState().getTaskRuntime(taskId);
      runtime?.upload?.abort();
      runtime?.sse?.close();

      updateTask(taskId, { status: 'cancelled' });

      void (async () => {
        try {
          await tasksApi.cancel(taskId);
        } catch {
          // ignore
        }
      })();
    },
    [updateTask]
  );

  const handlePreviewTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      const pageId = task?.pageId;
      if (!pageId) return;

      await refreshPages();
      setSelected({ kind: 'page', id: pageId, title: '' });
    },
    [tasks, refreshPages, setSelected]
  );

  useEffect(() => {
    return () => {
      cleanupAllRuntimes();
    };
  }, [cleanupAllRuntimes]);

  const dashboardCards = [
    { title: '新页面', meta: '2 小时前' },
    { title: 'Getting Started', meta: '2022 年 5 月 19 日' },
    { title: '新数据库', meta: '2025 年 5 月 6 日' },
    { title: '新建页面', meta: '', disabled: true },
  ];

  const templateCards = [{ title: '项目规划' }, { title: '会议纪要' }, { title: '周报' }];

  const formatTime = (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatYmd = (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '草稿';
      case 'PUBLISHED':
        return '已发布';
      default:
        return status;
    }
  };

  return (
    <HomeLayout
      sidebar={<PageSidebar onOpenImport={() => setOpenImportModal(true)} />}
    >
      <PageTopbar
        visible={selected.kind === 'page'}
        pageMode={pageMode}
        activePageExists={selected.kind === 'page'}
        pageTitle={pageTitle}
        publishedTitle={publishedSnapshot?.title ?? null}
        pageLoading={pageLoading}
        pageSaving={pageSaving}
        pagePublishing={pagePublishing}
        lastSavedAt={lastSavedAt}
        openMore={openPageMore}
        setOpenMore={setOpenPageMore}
        onCloseEdit={() => {
          if (!selectedPageId) return;
          router.push(`/pages/${encodeURIComponent(selectedPageId)}`);
        }}
        onEnterEdit={() => {
          if (!selectedPageId) return;
          router.push(`/pages/${encodeURIComponent(selectedPageId)}/edit`);
        }}
        onPublish={handlePublish}
        onOpenHistory={() => {
          if (!selectedPageId) return;
          router.push(`/page/${encodeURIComponent(selectedPageId)}/versions`);
        }}
      />

      <div className={cn('px-6 lg:px-11', selected.kind === 'page' ? 'py-6' : 'py-10')}>
        {selected.kind === 'page' ? (
          <PageEditor />
        ) : (
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
        )}
      </div>

      <DeleteConfirmDialog
        target={deleteTarget}
        deleting={deletingPage}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImportPageModal
        open={openImportModal}
        onOpenChange={(open) => setOpenImportModal(open)}
        onPickMarkdownFile={(file) => void startImportMarkdown(file)}
        onPickPdfFile={(file) => void startImportPdf(file)}
        onPickDocxFile={(file) => void startImportDocx(file)}
      />

      <ProgressManager
        tasks={tasks}
        onCancelTask={handleCancelTask}
        onPreviewTask={(id) => void handlePreviewTask(id)}
      />
    </HomeLayout>
  );
}
