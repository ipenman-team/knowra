'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpaceStore } from '@/stores';
import { CreateRoleDialog } from './components/create-role-dialog';
import { RolePermissionDialog } from './components/role-permission-dialog';
import { RoleTable } from './components/role-table';
import { useRoles } from './hooks/use-roles';

export default function SpaceRolesPage() {
  const params = useParams();
  const spaceId = String(params.id ?? '');
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const spacesLoaded = useSpaceStore((s) => s.loaded);
  const spacesLoading = useSpaceStore((s) => s.loading);
  const space = useSpaceStore((s) => s.spaces.find((sp) => sp.id === spaceId));
  const waitingSpace = !space && (spacesLoading || !spacesLoaded);
  const isPersonalSpace = space?.type === 'PERSONAL';

  useEffect(() => {
    if (!spacesLoaded && !spacesLoading) {
      void ensureSpacesLoaded();
    }
  }, [ensureSpacesLoaded, spacesLoaded, spacesLoading]);

  const [createOpen, setCreateOpen] = useState(false);
  const [permissionRoleId, setPermissionRoleId] = useState('');

  const { loading, submitting, roles, createRole, updateRole, removeRole } =
    useRoles(spaceId, { disabled: waitingSpace || isPersonalSpace });

  const editingRole = useMemo(
    () => roles.find((role) => role.id === permissionRoleId) ?? null,
    [permissionRoleId, roles],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">角色管理</h1>
        {!isPersonalSpace ? (
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={loading || submitting}
          >
            新建角色
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {waitingSpace ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            空间信息加载中...
          </div>
        ) : isPersonalSpace ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            个人空间仅支持你自己（Owner），角色和权限固定，无需角色管理。
          </div>
        ) : (
          <RoleTable
            loading={loading}
            submitting={submitting}
            roles={roles}
            onConfigurePermissions={setPermissionRoleId}
            onDeleteRole={(roleId) => {
              void removeRole(roleId);
            }}
          />
        )}
      </div>

      {!isPersonalSpace ? (
        <>
          <CreateRoleDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            loading={loading || submitting}
            onSubmit={({ name, description }) =>
              createRole({
                name,
                description,
                permissions: [],
              })
            }
          />

          <RolePermissionDialog
            key={permissionRoleId || 'role-permission-dialog'}
            open={Boolean(editingRole)}
            role={editingRole}
            loading={loading || submitting}
            onOpenChange={(open) => {
              if (!open) setPermissionRoleId('');
            }}
            onSave={(roleId, data) => {
              void updateRole(roleId, data);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
