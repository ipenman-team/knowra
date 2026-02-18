export type ListCommentThreadsQuery = {
  pageId?: string;
  source?: 'ALL' | 'INTERNAL' | 'EXTERNAL';
  status?: 'ALL' | 'OPEN' | 'RESOLVED' | 'ARCHIVED';
  cursor?: string;
  limit?: string;
  password?: string;
};
