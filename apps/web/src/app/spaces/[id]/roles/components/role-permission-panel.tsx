'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';
import { PERMISSION_GROUPS } from '../permission-keys';

type RolePermissionPanelProps = {
  role: SpaceRoleDto | null;
  loading?: boolean;
  onSave: (
    roleId: string,
    params: { name?: string; description?: string | null; permissions?: string[] },
  ) => void;
  onDelete: (roleId: string) => void;
};

export function RolePermissionPanel(props: RolePermissionPanelProps) {
  const { role, loading, onSave, onDelete } = props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!role) {
      setName('');
      setDescription('');
      setPermissions([]);
      return;
    }

    setName(role.name ?? '');
    setDescription(role.description ?? '');
    setPermissions(role.permissions ?? []);
  }, [role]);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const isOwnerBuiltIn = role?.isBuiltIn && role.builtInType === 'OWNER';
  const isBuiltInReadonlyName = role?.isBuiltIn;

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) => {
      const set = new Set(prev);
      if (checked) {
        set.add(permission);
      } else {
        set.delete(permission);
      }
      return [...set];
    });
  };

  const setGroupPermissions = (keys: string[], checked: boolean) => {
    setPermissions((prev) => {
      const set = new Set(prev);
      for (const key of keys) {
        if (checked) {
          set.add(key);
        } else {
          set.delete(key);
        }
      }
      return [...set];
    });
  };

  if (!role) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        请先在左侧选择一个角色
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="role-name">角色名称</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isBuiltInReadonlyName || loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">角色描述</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isBuiltInReadonlyName || loading}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-5">
          {PERMISSION_GROUPS.map((group) => {
            const keys = group.items.map((item) => item.key);

            return (
              <div key={group.key} className="rounded-md border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">{group.label}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isOwnerBuiltIn || loading}
                      onClick={() => setGroupPermissions(keys, true)}
                    >
                      全选
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isOwnerBuiltIn || loading}
                      onClick={() => setGroupPermissions(keys, false)}
                    >
                      全不选
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {group.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={permissionSet.has(item.key)}
                        disabled={isOwnerBuiltIn || loading}
                        onCheckedChange={(value) =>
                          togglePermission(item.key, Boolean(value))
                        }
                      />
                      <span>{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.key}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          {!role.isBuiltIn ? (
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => onDelete(role.id)}
            >
              删除角色
            </Button>
          ) : null}

          <Button
            disabled={loading || isOwnerBuiltIn}
            onClick={() => {
              if (role.isBuiltIn) {
                onSave(role.id, { permissions });
                return;
              }

              onSave(role.id, {
                name: name.trim(),
                description: description.trim() || null,
                permissions,
              });
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
