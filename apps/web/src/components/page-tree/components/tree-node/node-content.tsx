import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useIsNodeRenaming,
  useRenamingValue,
  useSavingRename,
  useUIStateStore,
} from '@/stores';

/**
 * 树节点内容组件
 * 根据编辑状态显示标签或输入框
 *
 * 合并了以下原组件：
 * - atoms/page-tree/label.tsx (节点标签按钮)
 * - atoms/page-tree/rename-input.tsx (重命名输入框)
 * - molecules/page-tree/node-content.tsx (编辑/显示切换逻辑)
 */
export const TreeNodeContent = memo(function TreeNodeContent({
  nodeId,
  label,
  isSelected,
  onSelect,
  onCommitRename,
}: {
  nodeId: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onCommitRename: () => void;
}) {
  const isRenaming = useIsNodeRenaming(nodeId);
  const renamingValue = useRenamingValue();
  const savingRename = useSavingRename();
  const { setRenamingValue, cancelRename } = useUIStateStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onCommitRename();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancelRename();
      }
    },
    [onCommitRename, cancelRename]
  );

  // 编辑模式：显示输入框
  if (isRenaming) {
    return (
      <input
        className={cn(
          'h-9 w-full flex-1 rounded-md border bg-background px-2 text-sm',
          'border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
        value={renamingValue}
        autoFocus
        disabled={savingRename}
        onChange={(e) => setRenamingValue(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onBlur={cancelRename}
      />
    );
  }

  // 显示模式：显示标签按钮
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        'h-9 w-full flex-1 justify-start px-2',
        isSelected && 'bg-accent text-accent-foreground'
      )}
      onClick={onSelect}
    >
      <span className="truncate">{label}</span>
    </Button>
  );
});
