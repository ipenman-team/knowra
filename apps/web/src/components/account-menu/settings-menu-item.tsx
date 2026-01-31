"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

export const SettingsMenuItem = memo(function SettingsMenuItem() {
  const router = useRouter();
  const handleSelect = useCallback(() => {
    router.push("/settings");
  }, [router]);

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      设置
      <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
