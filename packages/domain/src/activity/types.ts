export type ActivityMetadata = unknown;

export type Activity = {
  id: string;
  tenantId: string;

  action: string;
  subjectType: string;
  subjectId: string;
  actorUserId: string;

  occurredAt: Date;

  metadata?: ActivityMetadata | null;
  traceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateActivityParams = {
  tenantId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  actorUserId: string;

  occurredAt?: Date | null;
  metadata?: ActivityMetadata | null;
  traceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type ListActivitiesParams = {
  tenantId: string;

  limit?: number | null;
  cursor?: string | null;

  actorUserId?: string | null;
  action?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;

  from?: Date | null;
  to?: Date | null;
};

export type ListActivitiesResult = {
  items: Activity[];
  nextCursor?: string | null;
  hasMore: boolean;
};
