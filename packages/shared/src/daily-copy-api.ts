export type DailyCopyCategory =
  | 'CLASSIC'
  | 'POETRY'
  | 'CELEBRITY'
  | 'PHILOSOPHY'
  | 'POSITIVE'
  | 'WARM'
  | 'AESTHETIC';

export type DailyCopyMetadata = {
  liked?: boolean;
  [key: string]: unknown;
};

export type DailyCopyDto = {
  id: string;
  tenantId: string;
  userId: string;

  day: string; // "YYYY-MM-DD"
  category: DailyCopyCategory;
  content: string;
  metadata?: DailyCopyMetadata | null;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
};

export type GetTodayDailyCopyResponse = {
  ok: true;
  item: DailyCopyDto;
};

export type SetTodayDailyCopyLikeBody = {
  liked: boolean;
};

export type SetTodayDailyCopyLikeResponse = {
  ok: true;
  item: DailyCopyDto;
};
