'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions ?? [],
  );

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const isOwnerBuiltIn = role?.isBuiltIn && role.builtInType === 'OWNER';
  const isBuiltInReadonlyName = Boolean(role?.isBuiltIn);

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
    if (!role) return;

    if (role.isBuiltIn) {
      onSave(role.id, { permissions });
      return;
    }

    onSave(role.id, {
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-5xl"
      title={role ? `配置权限：${role.name}` : '配置权限'}
      confirmText="保存"
      confirmDisabled={!role || loading || isOwnerBuiltIn}
      onConfirm={handleSave}
    >
      {role ? (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="permission-role-name">角色名称</Label>
              <Input
                id="permission-role-name"
                value={name}
                disabled={isBuiltInReadonlyName || loading}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission-role-description">角色描述</Label>
              <Textarea
                id="permission-role-description"
                value={description}
                rows={3}
                disabled={isBuiltInReadonlyName || loading}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          {isOwnerBuiltIn ? (
            <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              所有者角色权限固定，不可编辑。
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={allSelected}
              disabled={loading || isOwnerBuiltIn}
              onCheckedChange={(value) =>
                setManyPermissions([...ALL_PERMISSION_KEYS], Boolean(value))
              }
            />
            <span>全选</span>
          </label>

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
                  <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={groupAllSelected}
                      disabled={loading || isOwnerBuiltIn}
                      onCheckedChange={(value) =>
                        setManyPermissions(keys, Boolean(value))
                      }
                    />
                    <span>{group.label}</span>
                  </label>

                  <div className="grid gap-2 md:grid-cols-2">
                    {group.items.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Checkbox
                          checked={permissionSet.has(item.key)}
                          disabled={loading || isOwnerBuiltIn}
                          onCheckedChange={(value) =>
                            togglePermission(item.key, Boolean(value))
                          }
                        />
                        <span>{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.key}
                        </span>
                      </label>
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
