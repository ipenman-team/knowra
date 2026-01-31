"use client";

import { memo } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const AccountNameItem = memo(function AccountNameItem({
  nickname,
}: {
  nickname: string;
}) {
  return <DropdownMenuItem disabled>{nickname || "未设置昵称"}</DropdownMenuItem>;
});
