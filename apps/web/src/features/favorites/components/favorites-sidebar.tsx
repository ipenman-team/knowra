'use client';

import { Building2, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { FavoriteSection } from '../types';

type FavoritesSidebarProps = {
  section: FavoriteSection;
  onSectionChange: (section: FavoriteSection) => void;
};

export function FavoritesSidebar(props: FavoritesSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
      <SidebarHeader className="p-4">
        <div className="text-sm font-semibold">我的收藏</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>分类</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={props.section === 'SPACE'}
                onClick={() => props.onSectionChange('SPACE')}
              >
                <span>空间</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={props.section === 'PAGE'}
                onClick={() => props.onSectionChange('PAGE')}
              >
                <span>页面</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
