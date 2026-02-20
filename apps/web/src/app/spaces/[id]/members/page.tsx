'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSpaceStore } from '@/stores';
import { AddMemberDrawer } from './components/add-member-drawer';
import { MemberTable } from './components/member-table';
import { useMembers } from './hooks/use-members';

export default function SpaceMembersPage() {
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
    updateMemberRole,
    batchUpdateMemberRole,
    removeMember,
    batchRemoveMembers,
    inviteMembers,
  } = useMembers(spaceId, { disabled: waitingSpace || isPersonalSpace });

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <h1 className="text-lg font-semibold">成员管理</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {waitingSpace ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            空间信息加载中...
          </div>
        ) : isPersonalSpace ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            个人空间仅支持你自己（Owner），不支持成员管理。
          </div>
        ) : (
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
            onAddMember={() => setDrawerOpen(true)}
          />
        )}
      </div>

      {!isPersonalSpace ? (
        <AddMemberDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          roles={roles}
          defaultRoleId={defaultRoleId}
          loading={submitting}
          onSubmit={({ emailsRaw, roleId }) => inviteMembers(emailsRaw, roleId)}
        />
      ) : null}
    </div>
  );
}
