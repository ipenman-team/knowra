'use client';

import { memo, useCallback } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n/provider';

export const ProfileMenuItem = memo(function ProfileMenuItem({
  onOpenProfile,
}: {
  onOpenProfile: () => void;
}) {
  const { t } = useI18n();

  const handleSelect = useCallback(() => {
    onOpenProfile();
  }, [onOpenProfile]);

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      {t('account.profile')}
      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
