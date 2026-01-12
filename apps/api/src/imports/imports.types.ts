export type ImportFormat = 'markdown';

export type ImportRequest = {
  format?: ImportFormat;
  title?: string;
  parentIds?: string | string[];
};
