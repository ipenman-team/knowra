export type PageContent = unknown;

export type PageVersionStatus = 'DRAFT' | 'TEMP' | 'PUBLISHED';

export type PageVersionDto = {
  id: string;
  tenantId: string;
  pageId: string;
  status: PageVersionStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type PageVersionDetailDto = {
  id: string;
  pageId: string;
  status: PageVersionStatus;
  title: string;
  content: PageContent;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

export type PublishedPageDto = {
  id: string;
  pageId: string;
  status: 'PUBLISHED';
  title: string;
  content: PageContent;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

export type PageDto = {
  id: string;
  tenantId: string;
  spaceId: string;
  title: string;
  content?: PageContent;
  parentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePageInput = {
  title: string;
  content?: PageContent;
  parentIds?: string[];
};

export type SavePageInput = {
  title?: string;
  content?: PageContent;
  parentIds?: string[];
};
