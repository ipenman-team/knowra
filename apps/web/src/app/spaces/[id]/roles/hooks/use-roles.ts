'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { spaceRolesApi } from '@/lib/api';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';

export function useRoles(spaceId: string, options?: { disabled?: boolean }) {
  const disabled = Boolean(options?.disabled);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<SpaceRoleDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const fetchRoles = useCallback(async () => {
    const data = await spaceRolesApi.list(spaceId);
    setRoles(data);

    setSelectedRoleId((prev) => {
      if (prev && data.some((role) => role.id === prev)) return prev;
      return data[0]?.id ?? '';
    });
  }, [spaceId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchRoles();
    } catch {
      toast.error('加载角色失败');
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      setSubmitting(false);
      setRoles([]);
      setSelectedRoleId('');
      return;
    }

    void refresh();
  }, [disabled, refresh]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const createRole = useCallback(
    async (params: {
      name: string;
      description?: string | null;
      permissions: string[];
    }) => {
      if (disabled) return false;

      setSubmitting(true);
      try {
        const created = await spaceRolesApi.create(spaceId, params);
        toast.success('角色创建成功');
        await fetchRoles();
        setSelectedRoleId(created.id);
        return true;
      } catch {
        toast.error('角色创建失败');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchRoles, spaceId],
  );

  const updateRole = useCallback(
    async (
      roleId: string,
      params: {
        name?: string;
        description?: string | null;
        permissions?: string[];
      },
    ) => {
      if (disabled) return;

      setSubmitting(true);
      try {
        await spaceRolesApi.update(spaceId, roleId, params);
        toast.success('角色已保存');
        await fetchRoles();
      } catch {
        toast.error('角色保存失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchRoles, spaceId],
  );

  const removeRole = useCallback(
    async (roleId: string) => {
      if (disabled) return;

      setSubmitting(true);
      try {
        await spaceRolesApi.remove(spaceId, roleId);
        toast.success('角色已删除');
        await fetchRoles();
      } catch {
        toast.error('角色删除失败');
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, fetchRoles, spaceId],
  );

  return {
    loading,
    submitting,
    roles,
    selectedRole,
    selectedRoleId,
    setSelectedRoleId,
    createRole,
    updateRole,
    removeRole,
    refresh,
  };
}
