'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddMemberDrawer } from './components/add-member-drawer';
import { MemberTable } from './components/member-table';
import { useMembers } from './hooks/use-members';

export default function SpaceMembersPage() {
  const params = useParams();
  const spaceId = String(params.id ?? '');

  const {
    loading,
    submitting,
    members,
    roles,
    total,
    page,
    totalPages,
    queryInput,
    defaultRoleId,
    setQueryInput,
    setPage,
    search,
    updateMemberRole,
    batchUpdateMemberRole,
    removeMember,
    batchRemoveMembers,
    inviteMembers,
  } = useMembers(spaceId);

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">成员管理</h1>
        <Button onClick={() => setDrawerOpen(true)} disabled={loading || submitting}>
          添加成员
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <MemberTable
          loading={loading}
          submitting={submitting}
          members={members}
          roles={roles}
          total={total}
          page={page}
          totalPages={totalPages}
          queryInput={queryInput}
          onQueryInputChange={setQueryInput}
          onSearch={search}
          onPageChange={setPage}
          onUpdateRole={(memberId, roleId) => {
            void updateMemberRole(memberId, roleId);
          }}
          onBatchUpdateRole={(memberIds, roleId) => {
            void batchUpdateMemberRole(memberIds, roleId);
          }}
          onRemoveMember={(memberId) => {
            void removeMember(memberId);
          }}
          onBatchRemove={(memberIds) => {
            void batchRemoveMembers(memberIds);
          }}
        />
      </div>

      <AddMemberDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        roles={roles}
        defaultRoleId={defaultRoleId}
        loading={submitting}
        onSubmit={({ emailsRaw, roleId }) => inviteMembers(emailsRaw, roleId)}
      />
    </div>
  );
}
