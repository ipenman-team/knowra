export type ListPageTreeQuery = {
  cursor?: string;
  take?: number;
  query?: string;
  parentId?: string;
  onlyRoots?: boolean;
};
