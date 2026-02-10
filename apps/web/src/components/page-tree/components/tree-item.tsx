import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/components/shared/tree';
import type { TreeRenderContext } from '@/components/shared/tree';
import {
  TreeNodeExpandButton,
  TreeNodeActions,
  TreeNodeContent,
  TreeNodeContextMenu,
} from './tree-node';
import {
  useIsPageSelected,
  useNodeMenuState,
  usePageSelectionStore,
  useUIStateStore,
} from '@/stores';
import type { PageDto } from '@/lib/api';
import { useNavigation, useSpaceRoute } from '@/lib/navigation';
import { usePageTreeCRUD } from '../hooks/use-pages';

interface PageTreeItemProps<T> extends TreeRenderContext<T> {
  onCreateChildPage?: (node: TreeNode<T>) => void;
  onCommitRename?: () => void;
}

export const PageTreeItem = memo(
  function PageTreeItem<T = PageDto>({
    node,
    depth,
    hasChildren,
    expanded,
    toggleExpanded,
    onCommitRename,
  }: PageTreeItemProps<T>) {
    const isSelected = useIsPageSelected(node.id);
    const isMenuOpen = useNodeMenuState(node.id);

    const { navigateToPage } = useNavigation();
    const currentSpaceId = useSpaceRoute();
    const { setSelectedPage } = usePageSelectionStore();
    const { setOpenMenuNodeId, startRename, setDeleteTarget } =
      useUIStateStore();
    const { createPage } = usePageTreeCRUD();

    const handleSelect = useCallback(() => {
      // 使用新的 Navigation Service 直接跳转 URL
      // 状态会通过 RouteSync 自动同步
      if (currentSpaceId) {
        navigateToPage(currentSpaceId, node.id);
      }
    }, [currentSpaceId, navigateToPage, node.id]);

    const handleToggleMenu = useCallback(() => {
      setOpenMenuNodeId(isMenuOpen ? null : node.id);
    }, [isMenuOpen, node.id, setOpenMenuNodeId]);

    const handleCreateChildFromMenu = useCallback(() => {
      console.log('create child page', node.id);
      setOpenMenuNodeId(null);
      createPage(node.id);
    }, [node.id, createPage, setOpenMenuNodeId]);

    const handleRename = useCallback(() => {
      setOpenMenuNodeId(null);
      if (currentSpaceId) {
        navigateToPage(currentSpaceId, node.id);
      }
      startRename(node.id, node.label);
    }, [
      currentSpaceId,
      navigateToPage,
      node.id,
      node.label,
      setOpenMenuNodeId,
      startRename,
    ]);

    const handleDelete = useCallback(() => {
      setOpenMenuNodeId(null);
      setDeleteTarget({ id: node.id, title: node.label });
    }, [node.id, node.label, setOpenMenuNodeId, setDeleteTarget]);

    const handleCommitRename = useCallback(() => {
      if (onCommitRename) {
        onCommitRename();
      }
    }, [onCommitRename]);

    return (
      <div
        className={cn('flex min-w-0 items-center', 'group/page-node')}
        style={{ paddingLeft: 8 + depth * 14 }}
        data-node-row
      >
        <TreeNodeExpandButton
          hasChildren={hasChildren}
          expanded={expanded}
          onClick={toggleExpanded}
        />

        <TreeNodeContent
          nodeId={node.id}
          label={node.label}
          isSelected={isSelected}
          onSelect={handleSelect}
          onCommitRename={handleCommitRename}
        >
          <TreeNodeActions nodeId={node.id} onToggleMenu={handleToggleMenu} />
        </TreeNodeContent>

        <div className="relative">
          <TreeNodeContextMenu
            nodeId={node.id}
            label={node.label}
            isOpen={isMenuOpen}
            onCreateChild={handleCreateChildFromMenu}
            onRename={handleRename}
            onDelete={handleDelete}
            onClose={() => setOpenMenuNodeId(null)}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.label === nextProps.node.label &&
      prevProps.depth === nextProps.depth &&
      prevProps.hasChildren === nextProps.hasChildren &&
      prevProps.expanded === nextProps.expanded
    );
  },
) as <T = PageDto>(props: PageTreeItemProps<T>) => React.JSX.Element;

// 在开发环境中启用 why-did-you-render 追踪
if (process.env.NODE_ENV === 'development') {
  (PageTreeItem as unknown as { whyDidYouRender?: boolean }).whyDidYouRender =
    true;
}
