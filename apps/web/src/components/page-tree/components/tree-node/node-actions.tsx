import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreatingPage, useNodeMenuState } from '@/stores';

/**
 * 树节点操作按钮组
 * 包含：新增子页面、打开菜单
 *
 * 合并了以下原组件：
 * - atoms/page-tree/add-button.tsx (+ 按钮)
 * - atoms/page-tree/menu-trigger.tsx (... 按钮)
 * - molecules/page-tree/node-actions.tsx (按钮组编排)
 */
export const TreeNodeActions = memo(function TreeNodeActions({
  nodeId,
  onCreateChild,
  onToggleMenu,
}: {
  nodeId: string;
  onCreateChild: () => void;
  onToggleMenu: () => void;
}) {
  const creatingPage = useCreatingPage();
  const isMenuOpen = useNodeMenuState(nodeId);

  const handleToggleMenu = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onToggleMenu();
    },
    [onToggleMenu]
  );

  const handleCreateChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCreateChild();
    },
    [onCreateChild]
  );

  return (
    <div
      className={cn(
        'ml-1 flex items-center gap-0.5',
        'opacity-0 transition-opacity group-hover:opacity-100'
      )}
    >
      {/* 新增子页面按钮 */}
      <Button
        type="button"
        variant="ghost"
        className="h-7 w-7 px-0 text-muted-foreground"
        aria-label="新建子页面"
        disabled={creatingPage}
        onClick={handleCreateChild}
      >
        +
      </Button>

      {/* 菜单触发按钮 */}
      <Button
        type="button"
        variant="ghost"
        className="h-7 w-7 px-0 text-muted-foreground"
        aria-label="更多"
        aria-expanded={isMenuOpen}
        onPointerDown={handleToggleMenu}
      >
        …
      </Button>
    </div>
  );
});
