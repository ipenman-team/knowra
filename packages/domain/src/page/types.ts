export type ExportPageData = {
  id: string;
  tenantId: string;
  spaceId: string;
  title: string;
  content: unknown;
  updatedAt?: Date;
};

export type GetPageForExportParams = {
  tenantId: string;
  pageId: string;
};

export interface PageExportRepository {
  getForExport(params: GetPageForExportParams): Promise<ExportPageData | null>;
}
