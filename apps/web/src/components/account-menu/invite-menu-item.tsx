"use client";

import { memo } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const InviteMenuItem = memo(function InviteMenuItem() {
  return <DropdownMenuItem disabled>邀请成员</DropdownMenuItem>;
});
