"use client";

import { memo } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/provider";

export const InviteMenuItem = memo(function InviteMenuItem() {
  const { t } = useI18n();
  return <DropdownMenuItem disabled>{t('account.inviteMember')}</DropdownMenuItem>;
});
