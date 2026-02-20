'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';
import { ALL_PERMISSION_KEYS, PERMISSION_GROUPS } from '../permission-keys';

type RolePermissionDialogProps = {
  open: boolean;
  role: SpaceRoleDto | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    roleId: string,
    params: {
      name?: string;
      description?: string | null;
      permissions?: string[];
    },
  ) => void;
};

export function RolePermissionDialog(props: RolePermissionDialogProps) {
  const { open, role, loading, onOpenChange, onSave } = props;
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions ?? [],
  );

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const isBuiltInReadonlyPermissions = role?.isBuiltIn === true;

  const setManyPermissions = (keys: string[], checked: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return [...next];
    });
  };

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(permission);
      } else {
        next.delete(permission);
      }
      return [...next];
    });
  };

  const allSelected =
    ALL_PERMISSION_KEYS.length > 0 &&
    ALL_PERMISSION_KEYS.every((permission) => permissionSet.has(permission));

  const handleSave = () => {
    if (!role || role.isBuiltIn) return;

    onSave(role.id, { permissions });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-5xl"
      title="配置权限"
      confirmText="保存"
      confirmDisabled={!role || loading || isBuiltInReadonlyPermissions}
      onConfirm={handleSave}
    >
      {role ? (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {isBuiltInReadonlyPermissions ? (
            <div className="text-sm text-muted-foreground">
              系统内置角色权限不可修改。
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              aria-label="全选"
              checked={allSelected}
              disabled={loading || isBuiltInReadonlyPermissions}
              onCheckedChange={(value) =>
                setManyPermissions([...ALL_PERMISSION_KEYS], Boolean(value))
              }
            />
            <span>全选</span>
          </div>

          <div className="grid gap-4">
            {PERMISSION_GROUPS.map((group) => {
              const keys = group.items.map((item) => item.key);
              const groupAllSelected = keys.every((key) =>
                permissionSet.has(key),
              );

              return (
                <div
                  key={group.key}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label={`${group.label}全选`}
                      checked={groupAllSelected}
                      disabled={loading || isBuiltInReadonlyPermissions}
                      onCheckedChange={(value) =>
                        setManyPermissions(keys, Boolean(value))
                      }
                    />
                    <span>{group.label}</span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {group.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Checkbox
                          aria-label={item.label}
                          checked={permissionSet.has(item.key)}
                          disabled={loading || isBuiltInReadonlyPermissions}
                          onCheckedChange={(value) =>
                            togglePermission(item.key, Boolean(value))
                          }
                        />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
