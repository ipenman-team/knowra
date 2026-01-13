import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 树节点右键菜单
 * 提供重命名和删除操作
 */
export const TreeNodeContextMenu = memo(function TreeNodeContextMenu({
  nodeId,
  label,
  isOpen,
  onRename,
  onDelete,
  onClose,
}: {
  nodeId: string;
  label: string;
  isOpen: boolean;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const handleRename = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRename();
    },
    [onRename]
  );

  const handleDelete = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    },
    [onDelete]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute right-0 top-8 z-50 w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground'
      )}
      onPointerDown={handlePointerDown}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full justify-start rounded-none px-2"
        onPointerDown={handleRename}
      >
        重命名
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full justify-start rounded-none px-2 text-destructive"
        onPointerDown={handleDelete}
      >
        删除
      </Button>
    </div>
  );
});
