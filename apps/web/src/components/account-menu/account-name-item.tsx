"use client";

import { memo } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/provider";

export const AccountNameItem = memo(function AccountNameItem({
  nickname,
}: {
  nickname: string;
}) {
  const { t } = useI18n();

  return (
    <DropdownMenuItem disabled>
      {nickname || t('account.unsetNickname')}
    </DropdownMenuItem>
  );
});
