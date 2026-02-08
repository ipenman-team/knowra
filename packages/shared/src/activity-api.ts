export type ActivitiesQuery = {
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  subjectType?: string;
  subjectId?: string;
  actorUserId?: string;
  action?: string;
  limit?: number; // 1..200
  cursor?: string; // "createdAt:id"
};

export type ActivityItem = {
  id: string;
  action: string;
  actionName?: string | null;
  content?: string | null;
  ActivityItem: string;
  subjectType: string;
  subjectId: string;
  actorUserId: string;
  createdAt: string; // ISO datetime
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type ActivitiesResponse = {
  items: ActivityItem[];
  nextCursor?: string | null;
  hasMore: boolean;
};

export type ActivityDailyStatsQuery = {
  from: string; // ISO date, inclusive
  to: string; // ISO date, inclusive
  actorUserId?: string;
  subjectType?: string;
  subjectId?: string;
  action?: string;
};

export type DailyCount = { date: string; count: number }; // date: "YYYY-MM-DD"

export type ActivityDailyStatsResponse = {
  items: DailyCount[];
};
