import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNodeMenuState } from '@/stores';
import { EllipsisIcon } from 'lucide-react';

export const TreeNodeActions = memo(function TreeNodeActions({
  nodeId,
  onToggleMenu,
}: {
  nodeId: string;
  onToggleMenu: () => void;
}) {
  const isMenuOpen = useNodeMenuState(nodeId);
  const visibilityClass =
    'opacity-0 transition-opacity group-hover/page-node:opacity-100 group-focus-within/page-node:opacity-100';

  const handleToggleMenu = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onToggleMenu();
    },
    [onToggleMenu]
  );

  return (
    <div
      className={cn(
        'ml-1 flex shrink-0 items-center gap-0.5',
        visibilityClass
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-7 w-7 px-0 text-muted-foreground"
        data-node-menu-trigger={nodeId}
        aria-label="更多"
        aria-expanded={isMenuOpen}
        onPointerDown={handleToggleMenu}
      >
        <EllipsisIcon className="h-3 w-3" />
      </Button>
    </div>
  );
});
