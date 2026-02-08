export type DailyCopyCategory =
  | 'CLASSIC'
  | 'POETRY'
  | 'CELEBRITY'
  | 'PHILOSOPHY'
  | 'POSITIVE'
  | 'WARM'
  | 'AESTHETIC';

export type DailyCopy = {
  id: string;
  tenantId: string;
  userId: string;

  day: string; // "YYYY-MM-DD" (local day key)
  category: DailyCopyCategory;
  content: string;

  expiresAt: Date;

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDailyCopyParams = {
  tenantId: string;
  userId: string;

  day: string;
  category: DailyCopyCategory;
  content: string;
  expiresAt: Date;
};

export type FindDailyCopyParams = {
  tenantId: string;
  userId: string;
  day: string;
};
