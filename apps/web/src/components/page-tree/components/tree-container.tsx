import { memo } from 'react';
import { Tree } from '@/components/shared/tree';
import { PageTreeItem } from './tree-item';
import { usePageTreeNodes } from '@/stores';
import { usePageTreeCRUD } from '../hooks/use-pages';
import type { PageDto } from '@/lib/api';
import { DeletePageAlertDialog } from './delete-page-alert-dialog';
export const PageTreeContainer = memo(function PageTreeContainer() {
  const { commitRename } = usePageTreeCRUD();
  const nodes = usePageTreeNodes();
  return (
    <>
      <Tree<PageDto>
        nodes={nodes}
        renderNode={(ctx) => (
          <PageTreeItem {...ctx} onCommitRename={commitRename} />
        )}
      />
      <DeletePageAlertDialog />
    </>
  );
});
