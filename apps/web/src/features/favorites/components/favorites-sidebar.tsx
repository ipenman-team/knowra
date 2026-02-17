'use client';

import { useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { FavoriteSection } from '../types';
import { useI18n } from '@/lib/i18n/provider';

type FavoritesSidebarProps = {
  section: FavoriteSection;
  onSectionChange: (section: FavoriteSection) => void;
};

export function FavoritesSidebar(props: FavoritesSidebarProps) {
  const { t } = useI18n();
  const { section, onSectionChange } = props;
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSectionChange = useCallback(
    (section: FavoriteSection) => {
      onSectionChange(section);
      if (isMobile) {
        setOpenMobile(false);
      }
    },
    [isMobile, onSectionChange, setOpenMobile],
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
      <SidebarHeader className="p-4">
        <div className="text-sm font-semibold">{t('favoritesSidebar.title')}</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={section === 'SPACE'}
                onClick={() => handleSectionChange('SPACE')}
              >
                <span>{t('favoritesSidebar.space')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={section === 'PAGE'}
                onClick={() => handleSectionChange('PAGE')}
              >
                <span>{t('favoritesSidebar.page')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
