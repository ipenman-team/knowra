import { publicApiClient } from './public-client';
import type { ShareDto } from './shares';

export const publicSharesApi = {
  getPublicAccess: async (publicId: string, password?: string) => {
    const res = await publicApiClient.post<{
      share: ShareDto;
      snapshot?: {
        payload?: unknown;
        createdAt?: string;
      };
    }>(`/shares/public/${publicId}/access`, { password });
    return res.data;
  },
};

