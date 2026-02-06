import type {
  Activity,
  ActivityDailyStatsParams,
  ActivityDailyStatsResult,
  CreateActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
} from '../types';

export interface ActivityRepository {
  create(params: CreateActivityParams): Promise<Activity>;
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
  dailyStats(params: ActivityDailyStatsParams): Promise<ActivityDailyStatsResult>;
}
