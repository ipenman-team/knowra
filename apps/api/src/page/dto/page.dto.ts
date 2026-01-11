export type PageDto = {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  parentIds: string[];
  createdAt: Date;
  updatedAt: Date;
};
