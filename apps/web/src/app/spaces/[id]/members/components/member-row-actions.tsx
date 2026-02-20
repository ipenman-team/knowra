'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SpaceMemberDto, SpaceRoleDto } from '@/lib/api/spaces/types';

type MemberRowActionsProps = {
  member: SpaceMemberDto;
  roles: SpaceRoleDto[];
  disabled?: boolean;
  onRoleChange: (roleId: string) => void;
  onRemove: () => void;
};

export function MemberRowActions(props: MemberRowActionsProps) {
  const { member, roles, disabled, onRoleChange, onRemove } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>修改角色</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {roles.map((role) => (
              <DropdownMenuItem
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                className={
                  member.spaceRoleId === role.id ? 'bg-accent text-accent-foreground' : ''
                }
              >
                {role.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem className="text-destructive" onClick={onRemove}>
          移除成员
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
