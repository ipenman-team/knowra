import { useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api/client';
import { useTaskStore, usePageTreeStore } from '@/stores';
import type { ApiTaskDto } from '@/lib/api';
import type { ProgressTask } from '@/features/home/components/progress-manager';
import { pagesApi } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';

function mapApiStatus(
  status: ApiTaskDto['status']
): ProgressTask['status'] {
  switch (status) {
    case 'PENDING':
    case 'RUNNING':
      return 'running';
    case 'SUCCEEDED':
      return 'success';
    case 'CANCELLED':
      return 'cancelled';
    case 'FAILED':
    default:
      return 'error';
  }
}

function extractPageIdFromResult(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return undefined;
  if (!('pageId' in result)) return undefined;
  const value = (result as { pageId?: unknown }).pageId;
  return typeof value === 'string' ? value : undefined;
}

/**
 * Provides task subscription functionality for SSE-based task tracking
 */
export function useTaskSubscription() {
  const { updateTask, getTaskRuntime, setTaskRuntime } = useTaskStore();
  const { setPageTreeNodes } = usePageTreeStore();

  const refreshPages = useCallback(async () => {
    const pages = await pagesApi.list();
    setPageTreeNodes(buildPageTreeFromFlatPages(pages));
  }, [setPageTreeNodes]);

  const subscribeTaskEvents = useCallback(
    (taskId: string) => {
      const url = `${getApiBaseUrl()}/tasks/${encodeURIComponent(taskId)}/events`;
      const es = new EventSource(url);

      const runtime = getTaskRuntime(taskId) ?? {};
      runtime.sse = es;
      setTaskRuntime(taskId, runtime);

      es.onmessage = (evt) => {
        try {
          const apiTask = JSON.parse(evt.data) as ApiTaskDto;
          const nextStatus = mapApiStatus(apiTask.status);
          const nextProgress = Math.max(
            0,
            Math.min(100, Math.trunc(apiTask.progress ?? 0))
          );
          const pageId = extractPageIdFromResult(apiTask.result);

          updateTask(taskId, {
            progress: Math.max(0, nextProgress),
            status: nextStatus,
            pageId: pageId ?? undefined,
          });

          if (apiTask.status === 'SUCCEEDED' && pageId) {
            void refreshPages();
          }

          if (
            apiTask.status === 'SUCCEEDED' ||
            apiTask.status === 'FAILED' ||
            apiTask.status === 'CANCELLED'
          ) {
            runtime.sse?.close();
            delete runtime.sse;
          }
        } catch {
          // Ignore malformed SSE
        }
      };

      es.onerror = () => {
        updateTask(taskId, { status: 'error' });
        runtime.sse?.close();
        delete runtime.sse;
      };
    },
    [updateTask, getTaskRuntime, setTaskRuntime, refreshPages]
  );

  return { subscribeTaskEvents };
}
