'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useMeProfile, type MeProfile } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountNameItem } from './account-name-item';
import { ProfileModal } from './profile-modal';
import { InviteMenuItem } from './invite-menu-item';
import { SettingsMenuItem } from './settings-menu-item';
import { LogoutMenuItem } from './logout-menu-item';

type AccountMenuProps = {
  profile?: MeProfile | null;
};

export const AccountMenu = memo(function AccountMenu({
  profile: profileProp,
}: AccountMenuProps = {}) {
  const [mounted, setMounted] = useState(false);
  const pointerDownOutsideRef = useRef(false);

  const cachedProfile = useMeProfile();
  const profile = profileProp === undefined ? cachedProfile : profileProp;

  useEffect(() => {
    setMounted(true);
  }, []);

  const nickname = mounted ? profile?.nickname?.trim() || '' : '';
  const avatarUrl = mounted ? profile?.avatarUrl || undefined : undefined;
  const fallbackText = nickname ? nickname.slice(0, 1) : 'CN';
  const [profileOpen, setProfileOpen] = useState(false);
  const handleSelect = useCallback(() => {
    setProfileOpen(true);
  }, [setProfileOpen]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={undefined} />
        </Avatar>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{fallbackText}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56"
          align="start"
          onPointerDownOutside={() => {
            pointerDownOutsideRef.current = true;
          }}
          onCloseAutoFocus={(e) => {
            if (pointerDownOutsideRef.current) {
              e.preventDefault();
              pointerDownOutsideRef.current = false;
            }
          }}
        >
          <DropdownMenuGroup>
            <AccountNameItem nickname={nickname} />
            <DropdownMenuItem onSelect={handleSelect}>
              个人资料
            </DropdownMenuItem>
            <InviteMenuItem />
            <SettingsMenuItem />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <LogoutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        nickname={nickname}
        avatarUrl={avatarUrl}
        profile={profile}
      />
    </>
  );
});
