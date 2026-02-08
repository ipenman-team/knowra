import type {
  GetTodayDailyCopyResponse,
} from '@contexta/shared';
import { apiClient } from './client';

export const dailyCopiesApi = {
  async getToday() {
    const res = await apiClient.get<GetTodayDailyCopyResponse>('/daily-copies/today');
    return res.data;
  },
};
