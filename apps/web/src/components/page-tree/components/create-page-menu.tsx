import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FileText, PlusIcon, UploadIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { usePageTreeCRUD } from '../hooks/use-pages';
import { Button } from '@/components/ui/button';
import { ImportPageModal } from '@/features/home/components/import-page-modal';
import { importsApi } from '@/lib/api';
import { useTaskSubscription } from '@/hooks';
import { useTaskStore } from '@/stores';
import { toast } from 'sonner';

type ImportKind = 'markdown' | 'pdf' | 'docx';

const importHandlers: Record<
  ImportKind,
  (args: { file: File }, options: {
    signal?: AbortSignal;
    onUploadProgress?: (progress: number) => void;
  }) => Promise<{ ok: true; taskId: string }>
> = {
  markdown: importsApi.createMarkdown,
  pdf: importsApi.createPdf,
  docx: importsApi.createDocx,
};

export const CreatePageMenu = memo(function CreatePageMenu() {
  const { createPage, creatingPage } = usePageTreeCRUD();
  const { subscribeTaskEvents } = useTaskSubscription();
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const replaceTaskId = useTaskStore((s) => s.replaceTaskId);
  const setTaskRuntime = useTaskStore((s) => s.setTaskRuntime);
  const getTaskRuntime = useTaskStore((s) => s.getTaskRuntime);
  const cleanupTaskRuntime = useTaskStore((s) => s.cleanupTaskRuntime);
  const [importOpen, setImportOpen] = useState(false);

  const handleCreatePage = useCallback(() => {
    createPage();
  }, [createPage]);

  const handleOpenImport = useCallback(() => {
    setImportOpen(true);
  }, []);

  const startImport = useCallback(
    async (file: File, kind: ImportKind) => {
      const tempId = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const controller = new AbortController();
      let activeId = tempId;
      let lastProgress = 0;

      addTask({
        id: tempId,
        label: `导入 ${file.name}`,
        progress: 0,
        status: 'running',
      });
      setTaskRuntime(tempId, { upload: controller });

      const handleProgress = (progress: number) => {
        lastProgress = progress;
        updateTask(activeId, { progress: Math.min(99, Math.max(0, progress)) });
      };

      try {
        const createImport = importHandlers[kind];
        const result = await createImport(
          { file },
          {
            signal: controller.signal,
            onUploadProgress: handleProgress,
          },
        );

        replaceTaskId(tempId, result.taskId);
        activeId = result.taskId;
        updateTask(activeId, {
          progress: Math.min(99, Math.max(0, lastProgress)),
        });

        const runtime = getTaskRuntime(activeId);
        if (runtime?.upload) {
          delete runtime.upload;
          setTaskRuntime(activeId, runtime);
        }

        subscribeTaskEvents(result.taskId);
      } catch (error) {
        if (controller.signal.aborted) {
          updateTask(activeId, { status: 'cancelled' });
        } else {
          updateTask(activeId, { status: 'error' });
          toast.error('导入失败');
        }
        cleanupTaskRuntime(activeId);
      }
    },
    [
      addTask,
      updateTask,
      replaceTaskId,
      setTaskRuntime,
      getTaskRuntime,
      cleanupTaskRuntime,
      subscribeTaskEvents,
    ],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-6 w-6"
            size="icon"
            aria-label="创建"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuItem onSelect={handleCreatePage} disabled={creatingPage}>
            <FileText />
            页面
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenImport}>
            <UploadIcon />
            导入
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportPageModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onPickMarkdownFile={(file) => startImport(file, 'markdown')}
        onPickPdfFile={(file) => startImport(file, 'pdf')}
        onPickDocxFile={(file) => startImport(file, 'docx')}
      />
    </>
  );
});
