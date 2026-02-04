"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { clearAllSidebarPrefs, clearSidebarPrefs } from "@/lib/sidebar-prefs";
import { useMeStore } from "@/stores";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

export const LogoutMenuItem = memo(function LogoutMenuItem() {
  const router = useRouter();
  const userId = useMeStore((s) => s.user?.id);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout").catch(() => null);
    } finally {
      if (userId) {
        clearSidebarPrefs(userId);
      } else {
        clearAllSidebarPrefs();
      }
      setLoggingOut(false);
      router.replace("/login");
      router.refresh();
    }
  }, [loggingOut, router, userId]);

  const handleSelect = useCallback(
    () => {
      void handleLogout();
    },
    [handleLogout],
  );

  return (
    <DropdownMenuItem disabled={loggingOut} onSelect={handleSelect}>
      退出登录
      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
