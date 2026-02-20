import { apiClient } from './client';
import type {
  SpaceDto,
  SpaceInvitationDto,
  SpaceInvitationWithTokenDto,
  SpaceMemberDto,
} from '@/lib/api/spaces/types';

export const spacesApi = {
  async list(params?: {
    q?: string;
    skip?: number;
    take?: number;
    includeArchived?: boolean;
  }) {
    const res = await apiClient.get<{ items: SpaceDto[]; total: number }>('/spaces', {
      params,
    });
    return res.data;
  },

  async get(id: string) {
    const res = await apiClient.get<SpaceDto>(`/spaces/${encodeURIComponent(id)}`);
    return res.data;
  },

  async create(input: unknown) {
    const res = await apiClient.post('/spaces', input);
    const data = res.data as unknown;
    return data as SpaceDto;
  },

  async update(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string | null;
      identifier?: string | null;
      type?: string;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const res = await apiClient.put(`/spaces/${encodeURIComponent(id)}`, input);
    const data = res.data as unknown;
    return data as SpaceDto;
  },

  async rename(id: string, input: { name: string }) {
    const res = await apiClient.put(`/spaces/${encodeURIComponent(id)}/rename`, input);
    const data = res.data as unknown;
    return data as SpaceDto;
  },

  async setFavorite(id: string, input: { favorite: boolean }) {
    const res = await apiClient.put(`/spaces/${encodeURIComponent(id)}/favorite`, input);
    const data = res.data as { favorite: boolean };
    return data;
  },

  async listMembers(
    spaceId: string,
    params?: { q?: string; skip?: number; take?: number },
  ) {
    const res = await apiClient.get<{
      items: SpaceMemberDto[];
      total: number;
      skip: number;
      take: number;
    }>(`/spaces/${encodeURIComponent(spaceId)}/members`, { params });
    return res.data;
  },

  async updateMemberRole(
    spaceId: string,
    memberId: string,
    input: { roleId: string },
  ) {
    const res = await apiClient.put<{ ok: true }>(
      `/spaces/${encodeURIComponent(spaceId)}/members/${encodeURIComponent(memberId)}/role`,
      input,
    );
    return res.data;
  },

  async batchUpdateMemberRole(
    spaceId: string,
    input: { memberIds: string[]; roleId: string },
  ) {
    const res = await apiClient.put<{ ok: true; affected: number }>(
      `/spaces/${encodeURIComponent(spaceId)}/members/batch-role`,
      input,
    );
    return res.data;
  },

  async removeMember(spaceId: string, memberId: string) {
    const res = await apiClient.delete<{ ok: true }>(
      `/spaces/${encodeURIComponent(spaceId)}/members/${encodeURIComponent(memberId)}`,
    );
    return res.data;
  },

  async batchRemoveMembers(spaceId: string, input: { memberIds: string[] }) {
    const res = await apiClient.post<{ ok: true; affected: number }>(
      `/spaces/${encodeURIComponent(spaceId)}/members/batch-remove`,
      input,
    );
    return res.data;
  },

  async listInvitations(
    spaceId: string,
    params?: {
      statuses?: string[];
    },
  ) {
    const status =
      params?.statuses && params.statuses.length > 0
        ? params.statuses.join(',')
        : undefined;
    const res = await apiClient.get<SpaceInvitationDto[] | { items: SpaceInvitationDto[] }>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations`,
      {
        params: { status },
      },
    );
    const data = res.data as unknown;
    if (Array.isArray(data)) return data as SpaceInvitationDto[];
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
      return (data as { items: SpaceInvitationDto[] }).items;
    }
    return [];
  },

  async createEmailInvitations(
    spaceId: string,
    input: { emails: string[]; roleId?: string; role?: string },
  ) {
    const res = await apiClient.post<
      SpaceInvitationWithTokenDto[] | { items: SpaceInvitationWithTokenDto[] }
    >(
      `/spaces/${encodeURIComponent(spaceId)}/invitations`,
      input,
    );
    const data = res.data as unknown;
    if (Array.isArray(data)) return data as SpaceInvitationWithTokenDto[];
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
      return (data as { items: SpaceInvitationWithTokenDto[] }).items;
    }
    return [];
  },

  async createLinkInvitation(
    spaceId: string,
    input?: { roleId?: string; role?: string },
  ) {
    const res = await apiClient.post<SpaceInvitationWithTokenDto>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations/link`,
      input ?? {},
    );
    return res.data;
  },

  async resendInvitation(spaceId: string, invitationId: string) {
    const res = await apiClient.post<SpaceInvitationWithTokenDto>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
      {},
    );
    return res.data;
  },

  async acceptInvitation(input: { token: string }) {
    const res = await apiClient.post<{
      tenantId: string;
      spaceId: string;
      invitationId: string;
    }>('/space-invitations/accept', input);
    return res.data;
  },
};

export type { SpaceDto };
