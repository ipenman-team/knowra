export type DailyCopyCategory =
  | 'CLASSIC'
  | 'POETRY'
  | 'CELEBRITY'
  | 'PHILOSOPHY'
  | 'POSITIVE'
  | 'WARM'
  | 'AESTHETIC';

export type DailyCopyDto = {
  id: string;
  tenantId: string;
  userId: string;

  day: string; // "YYYY-MM-DD"
  category: DailyCopyCategory;
  content: string;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
};

export type GetTodayDailyCopyResponse = {
  ok: true;
  item: DailyCopyDto;
};
