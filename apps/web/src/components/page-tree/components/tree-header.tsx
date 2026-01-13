import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreatingPage } from '@/stores';

/**
 * 页面树头部组件
 * 显示"页面"标题和新建/导入下拉菜单
 */
export const PageTreeHeader = memo(function PageTreeHeader({
  onCreatePage,
  onOpenImport,
}: {
  onCreatePage: () => void;
  onOpenImport: () => void;
}) {
  const creatingPage = useCreatingPage();
  const [openAddMenu, setOpenAddMenu] = useState(false);

  const handleToggleMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenAddMenu((prev) => !prev);
  }, []);

  const handleCreatePage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenAddMenu(false);
      onCreatePage();
    },
    [onCreatePage]
  );

  const handleOpenImport = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenAddMenu(false);
      onOpenImport();
    },
    [onOpenImport]
  );

  // 点击外部关闭菜单
  useEffect(() => {
    if (!openAddMenu) return;
    const handler = () => setOpenAddMenu(false);
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [openAddMenu]);

  return (
    <div className="relative flex h-8 items-center justify-between px-2">
      <div className="text-xs font-medium tracking-wide text-muted-foreground">
        页面
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-7 w-7 px-0 text-muted-foreground"
        aria-label="添加"
        aria-expanded={openAddMenu}
        onPointerDown={handleToggleMenu}
      >
        +
      </Button>

      {openAddMenu && (
        <div className="absolute right-0 top-8 z-50 w-28 overflow-hidden rounded-md border bg-popover">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full justify-start rounded-none px-2"
            disabled={creatingPage}
            onPointerDown={handleCreatePage}
          >
            新建页面
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full justify-start rounded-none px-2"
            onPointerDown={handleOpenImport}
          >
            导入
          </Button>
        </div>
      )}
    </div>
  );
});
