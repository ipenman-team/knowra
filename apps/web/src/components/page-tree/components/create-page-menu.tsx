import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PlusCircleIcon, FileText } from "lucide-react";
import { memo, useCallback } from "react";
import { usePageTreeCRUD } from "../hooks/use-page-tree-crud";

export const CreatePageMenu = memo(function CreatePageMenu() {
  const { createPage, creatingPage } = usePageTreeCRUD();

  const handleCreatePage = useCallback(() => {
    createPage();
  }, [createPage]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm text-muted-foreground transition hover:text-foreground"
          aria-label="创建"
        >
          <PlusCircleIcon className="h-4 w-4" />
        </button>
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
