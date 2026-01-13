import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tree } from '@/components/shared/tree';
import { PageTreeHeader } from './tree-header';
import { PageTreeItem } from './tree-item';
import { usePagesLoaded, usePageTreeNodes, useSelectedPageId } from '@/stores';
import { usePageTreeCRUD } from '../hooks/use-page-tree-crud';
import type { PageDto } from '@/lib/api';

/**
 * 页面树容器组件
 * 业务逻辑编排器，协调页面树的各个部分
 *
 * 合并了以下原组件：
 * - organisms/page-tree/tree-container.tsx
 * - organisms/page-tree/tree-list.tsx
 *
 * 业务逻辑已提取到 hooks/use-page-tree-crud.ts
 */
export const PageTreeContainer = memo(function PageTreeContainer({
  onOpenImport,
}: {
  onOpenImport: () => void;
}) {
  const pagesLoaded = usePagesLoaded();
  const nodes = usePageTreeNodes();
  const selectedPageId = useSelectedPageId();

  // 使用自定义 hook 处理所有 CRUD 操作
  const { createPage, createChildPage, commitRename, creatingPage } =
    usePageTreeCRUD();

  const empty = pagesLoaded && nodes.length === 0;

  // 空状态：显示新建按钮
  if (empty) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-start px-2"
        disabled={creatingPage}
        onClick={createPage}
      >
        新建
      </Button>
    );
  }

  // 正常状态：显示完整的页面树
  return (
    <>
      <PageTreeHeader
        onCreatePage={createPage}
        onOpenImport={onOpenImport}
      />

      <Tree<PageDto>
        nodes={nodes}
        selectedId={selectedPageId ?? undefined}
        renderNode={(ctx) => (
          <PageTreeItem
            {...ctx}
            onCreateChildPage={createChildPage}
            onCommitRename={commitRename}
          />
        )}
      />

      <Separator />
    </>
  );
});
