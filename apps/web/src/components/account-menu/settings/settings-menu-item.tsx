"use client";

import { memo, useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/provider";

export const SettingsMenuItem = memo(function SettingsMenuItem({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { t } = useI18n();

  const handleSelect = useCallback(() => {
    onOpenSettings();
  }, [onOpenSettings]);

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      {t('account.settings')}
      <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
