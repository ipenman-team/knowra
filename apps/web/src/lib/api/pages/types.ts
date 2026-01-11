export type PageDto = {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  parentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePageInput = {
  title: string;
  content?: string;
  parentIds?: string[];
};

export type SavePageInput = {
  title?: string;
  content?: string;
  parentIds?: string[];
};
