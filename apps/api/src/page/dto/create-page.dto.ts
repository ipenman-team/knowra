export type CreatePageDto = {
  tenantId: string;
  title: string;
  content?: string;
  parentIds?: string[];
};
