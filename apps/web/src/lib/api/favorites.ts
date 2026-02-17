import { apiClient } from './client';

export type FavoriteTargetType = 'SPACE' | 'PAGE' | (string & {});

export type FavoriteDto = {
  id: string;
  tenantId: string;
  userId: string;
  targetType: string;
  targetId: string;
  extraData?: unknown | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export const favoritesApi = {
  async set(input: {
    targetType: FavoriteTargetType;
    targetId: string;
    favorite: boolean;
    extraData?: unknown;
  }) {
    const res = await apiClient.put<{ favorite: boolean }>('/favorites', input);
    return res.data;
  },

  async getStatus(input: { targetType: FavoriteTargetType; targetId: string }) {
    const res = await apiClient.get<{ favorite: boolean }>('/favorites/status', {
      params: input,
    });
    return res.data;
  },

  async list(params?: {
    targetType?: FavoriteTargetType;
    targetIds?: string[];
    skip?: number;
    take?: number;
  }) {
    const targetIds =
      params?.targetIds && params.targetIds.length > 0
        ? params.targetIds.join(',')
        : undefined;

    const res = await apiClient.get<{ items: FavoriteDto[]; total: number }>('/favorites', {
      params: {
        targetType: params?.targetType,
        targetIds,
        skip: params?.skip,
        take: params?.take,
      },
    });

    return res.data;
  },
};
