"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useSpaces, useCurrentSpaceId, useSpaceStore } from '@/stores';
import { ChevronDown } from 'lucide-react';

export default function SpaceHeader() {
  const router = useRouter();
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  const current = spaces.find((s) => s.id === currentId) ?? spaces[0];

  const handleSelectSpace = useCallback(
    (id?: string | null) => {
      if (!id) return;
      setCurrent(id);
      router.push(`/spaces/${encodeURIComponent(id)}`);
    },
    [router, setCurrent]
  );

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
      <div className="flex items-center gap-3">
        <button
          className="text-sm font-semibold text-foreground/90"
        >
          {  }
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-semibold">{current?.name ?? '空间'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {spaces.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleSelectSpace(s.id);
                }}
              >
                {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div />
    </div>
  );
}
