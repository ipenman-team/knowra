import type {
  ActivitiesQuery,
  ActivitiesResponse,
  ActivityDailyStatsQuery,
  ActivityDailyStatsResponse,
} from '@knowra/shared';
import { apiClient } from '../client';

function buildParams(input: Record<string, unknown>) {
  const params: Record<string, string | number> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params[key] = typeof value === 'number' ? value : String(value);
  });
  return params;
}

export const workbenchApi = {
  async listActivities(query: ActivitiesQuery) {
    const res = await apiClient.get<ActivitiesResponse>('/activities', {
      params: buildParams(query),
    });
    return res.data;
  },

  async getDailyStats(query: ActivityDailyStatsQuery) {
    const res = await apiClient.get<ActivityDailyStatsResponse>(
      '/activities/stats/daily',
      {
        params: buildParams(query),
      },
    );
    return res.data;
  },
};
