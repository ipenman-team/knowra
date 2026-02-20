'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CreateRoleDialog } from './components/create-role-dialog';
import { RoleList } from './components/role-list';
import { RolePermissionPanel } from './components/role-permission-panel';
import { useRoles } from './hooks/use-roles';

export default function SpaceRolesPage() {
  const params = useParams();
  const spaceId = String(params.id ?? '');
  const [createOpen, setCreateOpen] = useState(false);

  const {
    loading,
    submitting,
    roles,
    selectedRole,
    selectedRoleId,
    setSelectedRoleId,
    createRole,
    updateRole,
    removeRole,
  } = useRoles(spaceId);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <h1 className="text-lg font-semibold">角色管理</h1>
      </div>

      <div className="grid h-[calc(100%-56px)] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <RoleList
          roles={roles}
          selectedRoleId={selectedRoleId}
          onSelect={setSelectedRoleId}
          onCreate={() => setCreateOpen(true)}
        />

        <RolePermissionPanel
          role={selectedRole}
          loading={loading || submitting}
          onSave={(roleId, data) => {
            void updateRole(roleId, data);
          }}
          onDelete={(roleId) => {
            void removeRole(roleId);
          }}
        />
      </div>

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
    </div>
  );
}
