'use client';

import { Trash2, UserRoundCog } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  const isOwnerMember =
    member.roleBuiltInType === 'OWNER' || member.role === 'OWNER';

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || isOwnerMember}
            tooltip={isOwnerMember ? '所有者成员角色不可修改' : '修改角色'}
            aria-label="修改角色"
          >
            <UserRoundCog className="h-4 w-4 text-muted-foreground" />
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
                    member.spaceRoleId === role.id
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                >
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || isOwnerMember}
            tooltip={isOwnerMember ? '所有者成员无法删除' : '删除成员'}
            aria-label="删除成员"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除成员</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除该成员吗？删除后，该成员将失去此空间访问权限。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
