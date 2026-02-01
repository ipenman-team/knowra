"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useSpaces, useCurrentSpaceId, useSpaceStore, useActivePage } from '@/stores';
import { ChevronDown } from 'lucide-react';

export const PageHeader = () => {
  const activePage = useActivePage();

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
      <div className="flex items-center gap-3">
        <button
          className="text-sm font-semibold text-foreground/90"
        >
          {activePage?.title?.trim()}
        </button>

        <DropdownMenu>
          <DropdownMenuContent align="start">
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div />
    </div>
  );
}
