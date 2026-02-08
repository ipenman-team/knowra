import type {
  GetTodayDailyCopyResponse,
  SetTodayDailyCopyLikeBody,
  SetTodayDailyCopyLikeResponse,
} from '@contexta/shared';
import { apiClient } from './client';

export const dailyCopiesApi = {
  async getToday() {
    const res = await apiClient.get<GetTodayDailyCopyResponse>('/daily-copies/today');
    return res.data;
  },
  async setLike(body: SetTodayDailyCopyLikeBody) {
    const res = await apiClient.put<SetTodayDailyCopyLikeResponse>(
      '/daily-copies/today/like',
      body,
    );
    return res.data;
  },
};
