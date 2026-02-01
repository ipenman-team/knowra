'use client';

import { useActivePage, usePageContentStore } from '@/stores';
import {
  EllipsisIcon,
  PencilLineIcon,
  SendIcon,
  UserRoundPlusIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export const PageHeader = () => {
  const activePage = useActivePage();
  const setPageMode = usePageContentStore((s) => s.setPageMode);
  const pageMode = usePageContentStore((s) => s.pageMode);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
      <div>
        <Button variant="link">
          {activePage?.title?.trim() || '无标题文档'}
        </Button>
      </div>
      <div>
        {pageMode === 'preview' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              disabled={!activePage}
              onClick={() => setPageMode('edit')}
              className="gap-1"
            >
              <PencilLineIcon />
              编辑
            </Button>
            <Button variant="link">
              <EllipsisIcon />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={() => setPageMode('preview')} className="gap-1">
              <SendIcon></SendIcon> 发布
            </Button>
            <Button variant="ghost">
              <UserRoundPlusIcon></UserRoundPlusIcon>分享
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              onClick={() => setPageMode('preview')}
              size="icon"
            >
              <XIcon></XIcon>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
