import { apiClient } from './client';
import type {
  SpaceDto,
  SpaceInvitationDto,
  SpaceInvitationWithTokenDto,
  SpaceMemberDto,
} from '@/lib/api/spaces/types';

export const spacesApi = {
  async list(params?: { q?: string; skip?: number; take?: number; includeArchived?: boolean }) {
    const res = await apiClient.get<{ items: SpaceDto[]; total: number }>('/spaces', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await apiClient.get<SpaceDto>(`/spaces/${encodeURIComponent(id)}`);
    return res.data;
  },

  async create(input: unknown) {
    const res = await apiClient.post('/spaces', input);
    // server returns { ok: true, space }
    const data = res.data as any;
    if (data && data.space) return data.space as SpaceDto;
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
    // server returns { ok: true, space }
    const data = res.data as any;
    if (data && data.space) return data.space as SpaceDto;
    return data as SpaceDto;
  },

  async rename(id: string, input: { name: string }) {
    const res = await apiClient.put(`/spaces/${encodeURIComponent(id)}/rename`, input);
    const data = res.data as any;
    if (data && data.space) return data.space as SpaceDto;
    return data as SpaceDto;
  },

  async setFavorite(id: string, input: { favorite: boolean }) {
    const res = await apiClient.put(`/spaces/${encodeURIComponent(id)}/favorite`, input);
    const data = res.data as any;
    if (data && typeof data.favorite === 'boolean') {
      return { favorite: data.favorite };
    }
    return data as { favorite: boolean };
  },

  async listMembers(spaceId: string) {
    const res = await apiClient.get<{ items: SpaceMemberDto[] }>(
      `/spaces/${encodeURIComponent(spaceId)}/members`,
    );
    const data = res.data as any;
    return Array.isArray(data?.items) ? (data.items as SpaceMemberDto[]) : [];
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
    const res = await apiClient.get<{ items: SpaceInvitationDto[] }>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations`,
      {
        params: { status },
      },
    );
    const data = res.data as any;
    return Array.isArray(data?.items)
      ? (data.items as SpaceInvitationDto[])
      : [];
  },

  async createEmailInvitations(
    spaceId: string,
    input: { emails: string[]; role?: string },
  ) {
    const res = await apiClient.post<{ items: SpaceInvitationWithTokenDto[] }>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations`,
      input,
    );
    const data = res.data as any;
    return Array.isArray(data?.items)
      ? (data.items as SpaceInvitationWithTokenDto[])
      : [];
  },

  async createLinkInvitation(spaceId: string, input?: { role?: string }) {
    const res = await apiClient.post<SpaceInvitationWithTokenDto>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations/link`,
      input ?? {},
    );
    return res.data as SpaceInvitationWithTokenDto;
  },

  async resendInvitation(spaceId: string, invitationId: string) {
    const res = await apiClient.post<SpaceInvitationWithTokenDto>(
      `/spaces/${encodeURIComponent(spaceId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
      {},
    );
    return res.data as SpaceInvitationWithTokenDto;
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
