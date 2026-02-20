import { apiClient } from './client';
import type { SpaceRoleDto } from './spaces/types';

export const spaceRolesApi = {
  async list(spaceId: string) {
    const res = await apiClient.get<SpaceRoleDto[] | { items: SpaceRoleDto[] }>(
      `/spaces/${encodeURIComponent(spaceId)}/roles`,
    );
    const data = res.data as unknown;
    if (Array.isArray(data)) return data as SpaceRoleDto[];
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
      return (data as { items: SpaceRoleDto[] }).items;
    }
    return [];
  },

  async create(
    spaceId: string,
    input: {
      name: string;
      description?: string | null;
      permissions: string[];
    },
  ) {
    const res = await apiClient.post<SpaceRoleDto>(
      `/spaces/${encodeURIComponent(spaceId)}/roles`,
      input,
    );
    return res.data;
  },

  async update(
    spaceId: string,
    roleId: string,
    input: {
      name?: string;
      description?: string | null;
      permissions?: string[];
    },
  ) {
    const res = await apiClient.put<SpaceRoleDto>(
      `/spaces/${encodeURIComponent(spaceId)}/roles/${encodeURIComponent(roleId)}`,
      input,
    );
    return res.data;
  },

  async remove(spaceId: string, roleId: string) {
    const res = await apiClient.delete<{
      ok: true;
      downgradedMemberCount: number;
      downgradedInvitationCount: number;
    }>(`/spaces/${encodeURIComponent(spaceId)}/roles/${encodeURIComponent(roleId)}`);
    return res.data;
  },
};
