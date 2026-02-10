import { apiClient } from './client';

export interface ShareDto {
  id: string;
  tenantId: string;
  type: 'PAGE' | 'SPACE' | 'AI_CONVERSATION' | 'CUSTOM';
  targetId: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  visibility: 'PUBLIC' | 'RESTRICTED';
  publicId: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  hasPassword?: boolean;
}

export interface CreateShareInput {
  type: 'PAGE' | 'SPACE' | 'AI_CONVERSATION' | 'CUSTOM';
  targetId: string;
  visibility?: 'PUBLIC' | 'RESTRICTED';
  password?: string | null;
  expiresAt?: string | null;
}

export interface UpdateShareInput {
  status?: 'ACTIVE' | 'REVOKED';
  visibility?: 'PUBLIC' | 'RESTRICTED';
  password?: string | null;
  expiresAt?: string | null;
}

export const sharesApi = {
  create: async (data: CreateShareInput) => {
    const res = await apiClient.post<{ ok: boolean; share: ShareDto; token: string | null }>('/shares', data);
    return res.data.share;
  },

  list: async (params: { targetId: string; type: string }) => {
    const res = await apiClient.get<{ ok: boolean; items: ShareDto[]; total: number }>('/shares', { params });
    return res.data.items;
  },

  update: async (id: string, data: UpdateShareInput) => {
    // If only status is being updated, use the status endpoint
    if (data.status && Object.keys(data).length === 1) {
      const res = await apiClient.post<{ ok: boolean; share: ShareDto }>(`/shares/${id}/status`, { status: data.status });
      return res.data.share;
    }
    
    // For other updates, use the general patch endpoint (requires backend implementation)
    const res = await apiClient.patch<{ ok: boolean; share: ShareDto }>(`/shares/${id}`, data);
    return res.data.share;
  },
  
  getPublicAccess: async (publicId: string, password?: string) => {
    const res = await apiClient.post<{
        ok: boolean;
        share: ShareDto;
        snapshot?: any; 
    }>(`/shares/public/${publicId}/access`, { password });
    return res.data;
  }
};
