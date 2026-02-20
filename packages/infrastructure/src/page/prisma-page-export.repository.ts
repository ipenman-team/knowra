import type { PrismaClient } from '@prisma/client';
import type { ExportPageData, GetPageForExportParams, PageExportRepository } from '@knowra/domain';

export class PrismaPageExportRepository implements PageExportRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async getForExport(params: GetPageForExportParams): Promise<ExportPageData | null> {
    const row = await this.prisma.page.findFirst({
      where: {
        id: params.pageId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      select: {
        id: true,
        tenantId: true,
        spaceId: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      tenantId: row.tenantId,
      spaceId: row.spaceId,
      title: row.title,
      content: row.content,
      updatedAt: row.updatedAt ?? undefined,
    };
  }
}
