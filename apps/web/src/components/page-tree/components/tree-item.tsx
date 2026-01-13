import React, { memo, useCallback } from 'react';
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

/**
 * 🔑 核心组件：树节点项
 *
 * 这是解决"整个树重渲染"问题的核心组件
 *
 * 关键性能优化模式：
 * 1. 每节点订阅：使用 useIsPageSelected(node.id) 代替基于 prop 的 selectedId
 * 2. 自定义 memo 比较：仅在该节点数据实际变化时重渲染
 * 3. 所有事件处理器使用 useCallback 包裹，保持依赖稳定
 */

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
    onCreateChildPage,
    onCommitRename,
  }: PageTreeItemProps<T>) {
    // ✅ 关键优化：每节点订阅
    // 只有该节点在其选中状态改变时才重渲染
    // 其他节点保持不变！
    const isSelected = useIsPageSelected(node.id);
    const isMenuOpen = useNodeMenuState(node.id);

    // 获取 store actions
    const { setSelectedPage } = usePageSelectionStore();
    const { setOpenMenuNodeId, startRename, setDeleteTarget } =
      useUIStateStore();

    // ✅ 所有回调都被 memoize 以防止子组件重渲染
    const handleSelect = useCallback(() => {
      setSelectedPage(node.id, node.label);
    }, [node.id, node.label, setSelectedPage]);

    const handleToggleMenu = useCallback(() => {
      setOpenMenuNodeId(isMenuOpen ? null : node.id);
    }, [isMenuOpen, node.id, setOpenMenuNodeId]);

    const handleCreateChild = useCallback(() => {
      if (onCreateChildPage) {
        onCreateChildPage(node);
      }
    }, [node, onCreateChildPage]);

    const handleRename = useCallback(() => {
      setOpenMenuNodeId(null);
      setSelectedPage(node.id, node.label);
      startRename(node.id, node.label);
    }, [node.id, node.label, setOpenMenuNodeId, setSelectedPage, startRename]);

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
        className="group flex items-center"
        style={{ paddingLeft: 8 + depth * 14 }}
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
        />

        <TreeNodeActions
          nodeId={node.id}
          onCreateChild={handleCreateChild}
          onToggleMenu={handleToggleMenu}
        />

        <div className="relative">
          <TreeNodeContextMenu
            nodeId={node.id}
            label={node.label}
            isOpen={isMenuOpen}
            onRename={handleRename}
            onDelete={handleDelete}
            onClose={() => setOpenMenuNodeId(null)}
          />
        </div>
      </div>
    );
  },
  // ✅ 自定义比较函数 - 仅在该节点数据改变时重渲染
  (prevProps, nextProps) => {
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.label === nextProps.node.label &&
      prevProps.depth === nextProps.depth &&
      prevProps.hasChildren === nextProps.hasChildren &&
      prevProps.expanded === nextProps.expanded
    );
  }
) as <T = PageDto>(props: PageTreeItemProps<T>) => React.JSX.Element;

// 在开发环境中启用 why-did-you-render 追踪
if (process.env.NODE_ENV === 'development') {
  (PageTreeItem as any).whyDidYouRender = true;
}
