'use client';

import { useCallback, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { pagesApi } from '@/lib/api/pages';
import { PageDto } from '@/lib/api/pages/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Empty } from '@/components/empty';

export function RecycleBin(props: { spaceId: string }) {
  const {
    data,
    isLoading,
    error,
    mutate: refresh,
  } = useSWR(['pages', 'trash', props.spaceId], () =>
    pagesApi.listTrash(props.spaceId),
  );

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRestore = useCallback(
    async (page: PageDto) => {
      try {
        setRestoringId(page.id);
        await pagesApi.restore(props.spaceId, page.id);
        toast.success('页面已恢复');
        refresh();
        // Refresh the page tree/list as well
        mutate((key: unknown) => Array.isArray(key) && key.includes('pages'));
      } catch (e) {
        toast.error('恢复失败');
        console.error(e);
      } finally {
        setRestoringId(null);
      }
    },
    [props.spaceId, refresh],
  );

  const handlePermanentDelete = useCallback(
    async (page: PageDto) => {
      try {
        setDeletingId(page.id);
        await pagesApi.permanentRemove(props.spaceId, page.id);
        toast.success('页面已永久删除');
        refresh();
      } catch (e) {
        toast.error('删除失败');
        console.error(e);
      } finally {
        setDeletingId(null);
      }
    },
    [props.spaceId, refresh],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        加载失败，请重试
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">回收站</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">页面名称</TableHead>
              <TableHead>删除时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Empty className="border-0 p-4"/>
                </TableCell>
              </TableRow>
            ) : (
              data?.map((page: PageDto) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">
                    {page.title || '无标题文档'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(page.updatedAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(page)}
                        disabled={!!restoringId || !!deletingId}
                      >
                        {restoringId === page.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        恢复
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={!!restoringId || !!deletingId}
                          >
                            {deletingId === page.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            彻底删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              确定要彻底删除吗？
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作无法撤销。页面「{page.title || '无标题文档'}
                              」将被永久删除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handlePermanentDelete(page)}
                            >
                              彻底删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
