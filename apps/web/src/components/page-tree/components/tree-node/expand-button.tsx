import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

/**
 * 树节点展开/收起按钮
 * 如果没有子节点，显示占位符
 *
 * 合并了以下原组件：
 * - atoms/page-tree/expand-button.tsx (展开/收起按钮)
 * - atoms/page-tree/spacer.tsx (占位符)
 */
export const TreeNodeExpandButton = memo(function TreeNodeExpandButton({
  hasChildren,
  expanded,
  onClick,
  disabled,
}: {
  hasChildren: boolean;
  expanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(e);
    },
    [onClick]
  );

  // 没有子节点时显示占位符
  if (!hasChildren) {
    return <span className="mr-1 h-7 w-7" aria-hidden="true" />;
  }

  // 有子节点时显示展开/收起按钮
  return (
    <Button
      type="button"
      variant="ghost"
      className="mr-1 h-7 w-7 px-0 text-muted-foreground"
      onClick={handleClick}
      disabled={disabled}
      aria-label={expanded ? '收起' : '展开'}
      aria-expanded={expanded}
    >
      {expanded ? '▾' : '▸'}
    </Button>
  );
});
