import type {
  Activity,
  CreateActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
} from '../types';

export interface ActivityRepository {
  create(params: CreateActivityParams): Promise<Activity>;
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
}
