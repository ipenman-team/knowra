export type ImportFormat = 'markdown' | 'pdf' | 'docx';

export type ImportRequest = {
  format?: ImportFormat;
  title?: string;
  spaceId?: string;
  parentId?: string;
  parentIds?: string | string[];
};
