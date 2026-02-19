import { apiClient } from './client';

export const authApi = {
  async switchTenant(input: { tenantId?: string; tenantKey?: string }) {
    const res = await apiClient.post('/auth/switch-tenant', input);
    return res.data as {
      tenant: {
        id: string;
        type: string;
        key: string | null;
        name: string;
      };
      token?: {
        accessToken?: string;
      };
    };
  },
};
