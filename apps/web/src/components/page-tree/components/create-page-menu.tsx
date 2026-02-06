import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PlusIcon, FileText } from "lucide-react";
import { memo, useCallback } from "react";
import { usePageTreeCRUD } from "../hooks/use-pages";
import { Button } from '@/components/ui/button';

export const CreatePageMenu = memo(function CreatePageMenu() {
  const { createPage, creatingPage } = usePageTreeCRUD();

  const handleCreatePage = useCallback(() => {
    createPage();
  }, [createPage]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className='h-6 w-6'
          size="icon"
          aria-label="创建"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem onSelect={handleCreatePage} disabled={creatingPage}>
          <FileText />
          页面
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
