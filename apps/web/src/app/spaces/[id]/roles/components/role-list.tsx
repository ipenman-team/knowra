'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';

type RoleListProps = {
  roles: SpaceRoleDto[];
  selectedRoleId: string;
  onSelect: (roleId: string) => void;
  onCreate: () => void;
};

export function RoleList(props: RoleListProps) {
  const { roles, selectedRoleId, onSelect, onCreate } = props;

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="border-b px-4 py-3 text-sm font-medium">角色列表</div>

      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                selectedRoleId === role.id && 'bg-muted font-medium',
              )}
            >
              {role.isBuiltIn ? <Lock className="h-3.5 w-3.5" /> : null}
              <span className="truncate">{role.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t p-3">
        <Button className="w-full" variant="outline" onClick={onCreate}>
          新建角色
        </Button>
      </div>
    </div>
  );
}
