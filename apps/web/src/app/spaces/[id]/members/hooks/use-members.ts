'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { spaceRolesApi, spacesApi } from '@/lib/api';
import type { SpaceMemberDto, SpaceRoleDto } from '@/lib/api/spaces/types';

const PAGE_SIZE = 20;

function isOwnerMember(member: SpaceMemberDto): boolean {
  return member.roleBuiltInType === 'OWNER' || member.role === 'OWNER';
}

function parseEmails(raw: string): string[] {
  const values = raw
    .split(/[\n,;，；\s]+/g)
    .map((item) => item.trim())
    .filter((item) => Boolean(item));

  return [...new Set(values)];
}

export function useMembers(spaceId: string, options?: { disabled?: boolean }) {
  const disabled = Boolean(options?.disabled);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<SpaceMemberDto[]>([]);
  const [roles, setRoles] = useState<SpaceRoleDto[]>([]);
  const [total, setTotal] = useState(0);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const skip = (page - 1) * PAGE_SIZE;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const defaultRoleId = useMemo(
    () =>
      roles.find((role) => role.isBuiltIn && role.builtInType === 'MEMBER')
        ?.id ??
      roles[0]?.id ??
      '',
    [roles],
  );

  const fetchRoles = useCallback(async () => {
    const data = await spaceRolesApi.list(spaceId);
    setRoles(data);
    return data;
  }, [spaceId]);

  const fetchMembers = useCallback(async () => {
    const data = await spacesApi.listMembers(spaceId, {
      q: query || undefined,
      skip,
      take: PAGE_SIZE,
    });

    setMembers(data.items);
    setTotal(data.total);
  }, [query, skip, spaceId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRoles(), fetchMembers()]);
    } catch {
      toast.error('加载成员数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchMembers, fetchRoles]);

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      setSubmitting(false);
      setMembers([]);
      setRoles([]);
      setTotal(0);
      return;
    }

    void refresh();
  }, [disabled, refresh]);

  useEffect(() => {
    if (disabled) return;

    const timer = window.setTimeout(() => {
      const nextQuery = queryInput.trim();
      setPage(1);
      setQuery((prev) => (prev === nextQuery ? prev : nextQuery));
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [disabled, queryInput]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const updateMemberRole = useCallback(
    async (memberId: string, roleId: string) => {
      if (disabled) return;
      const member = members.find((item) => item.id === memberId);
      if (member && isOwnerMember(member)) {
        toast.error('所有者成员角色不可修改');
        return;
      }

      setSubmitting(true);
      try {
        await spacesApi.updateMemberRole(spaceId, memberId, { roleId });
        toast.success('成员角色已更新');
        await fetchMembers();
      } catch {
        toast.error('更新成员角色失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchMembers, members, spaceId],
  );

  const batchUpdateMemberRole = useCallback(
    async (memberIds: string[], roleId: string) => {
      if (disabled) return;
      if (memberIds.length === 0) return;
      const ownerMemberIdSet = new Set(
        members.filter((member) => isOwnerMember(member)).map((member) => member.id),
      );
      const updatableMemberIds = memberIds.filter(
        (memberId) => !ownerMemberIdSet.has(memberId),
      );
      if (updatableMemberIds.length === 0) {
        toast.error('所有者成员角色不可修改');
        return;
      }

      setSubmitting(true);
      try {
        await spacesApi.batchUpdateMemberRole(spaceId, {
          memberIds: updatableMemberIds,
          roleId,
        });
        toast.success('批量角色更新成功');
        await fetchMembers();
      } catch {
        toast.error('批量角色更新失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchMembers, members, spaceId],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (disabled) return;

      setSubmitting(true);
      try {
        await spacesApi.removeMember(spaceId, memberId);
        toast.success('成员已移除');
        await fetchMembers();
      } catch {
        toast.error('移除成员失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchMembers, spaceId],
  );

  const batchRemoveMembers = useCallback(
    async (memberIds: string[]) => {
      if (disabled) return;
      if (memberIds.length === 0) return;

      setSubmitting(true);
      try {
        await spacesApi.batchRemoveMembers(spaceId, { memberIds });
        toast.success('批量移除成功');
        await fetchMembers();
      } catch {
        toast.error('批量移除失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchMembers, spaceId],
  );

  const inviteMembers = useCallback(
    async (emailsRaw: string, roleId: string) => {
      if (disabled) return false;

      const emails = parseEmails(emailsRaw);
      if (emails.length === 0) {
        toast.error('请输入至少一个邮箱');
        return false;
      }

      setSubmitting(true);
      try {
        await spacesApi.createEmailInvitations(spaceId, { emails, roleId });
        toast.success('邀请已发送');
        await fetchMembers();
        return true;
      } catch {
        toast.error('发送邀请失败');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchMembers, spaceId],
  );

  return {
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
    refresh,
    updateMemberRole,
    batchUpdateMemberRole,
    removeMember,
    batchRemoveMembers,
    inviteMembers,
  };
}
