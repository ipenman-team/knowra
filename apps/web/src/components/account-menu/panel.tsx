'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useMeProfile, useMeVerification, type MeProfile, type MeVerification } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountNameItem } from './account-name-item';
import { InviteMenuItem } from './invite-menu-item';
import { SettingsMenuItem } from './settings/settings-menu-item';
import { LogoutMenuItem } from './logout-menu-item';
import { SettingsModal } from './settings/settings-modal';
import { ProfileMenuItem } from './profile/profile-menu.item';
import { ProfileModal } from './profile/profile-modal';

type AccountMenuProps = {
  profile?: MeProfile | null;
  verification?: MeVerification | null;
};

export const AccountMenu = memo(function AccountMenu({
  profile: profileProp,
  verification: verificationProp,
}: AccountMenuProps = {}) {
  const [mounted, setMounted] = useState(false);
  const pointerDownOutsideRef = useRef(false);

  const cachedProfile = useMeProfile();
  const cachedVerification = useMeVerification();
  const profile = profileProp === undefined ? cachedProfile : profileProp;
  const verification =
    verificationProp === undefined ? cachedVerification : verificationProp;

  useEffect(() => {
    setMounted(true);
  }, []);

  const nickname = mounted ? profile?.nickname?.trim() || '' : '';
  const avatarUrl = mounted ? profile?.avatarUrl || undefined : undefined;
  const fallbackText = nickname ? nickname.slice(0, 1) : 'CN';
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
            <ProfileMenuItem onOpenProfile={() => setProfileOpen(true)} />
            <InviteMenuItem />
            <SettingsMenuItem onOpenSettings={() => setSettingsOpen(true)} />
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
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        verification={verification}
      />
    </>
  );
});
