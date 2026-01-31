"use client";

import { memo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { SettingsSection, SettingsSectionId } from "../settings-modal.types";

export const SettingsModalSidebar = memo(function SettingsModalSidebar({
  sections,
  activeId,
  onSelect,
}: {
  sections: SettingsSection[];
  activeId: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}) {
  return (
    <SidebarProvider className="min-h-0 w-56 flex-none">
      <Sidebar collapsible="none" className="h-full border-r bg-muted/20">
        <SidebarContent className="p-3">
          <SidebarGroup>
            <SidebarGroupLabel>账户</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sections.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === activeId}
                      onClick={() => onSelect(item.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
});
