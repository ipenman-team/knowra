'use client';

import { memo, useCallback } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

export const ProfileMenuItem = memo(function ProfileMenuItem({
  onOpenProfile,
}: {
  onOpenProfile: () => void;
}) {
  const handleSelect = useCallback(() => {
    onOpenProfile();
  }, [onOpenProfile]);

  return (
    <DropdownMenuItem onSelect={handleSelect}>
      个人资料
      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
});
