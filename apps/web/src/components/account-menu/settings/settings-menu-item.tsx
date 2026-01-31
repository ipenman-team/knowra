"use client";

import { memo, useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

export const SettingsMenuItem = memo(function SettingsMenuItem({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const handleSelect = useCallback(() => {
    onOpenSettings();
  }, [onOpenSettings]);

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      设置
      <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
