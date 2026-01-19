export type PublishedPageVersion = {
  tenantId: string;
  pageId: string;
  pageVersionId: string;
  title: string;
  content: unknown;
};

export type PublishedPageKnowledgeSource = {
  getPublishedPageVersion(input: {
    tenantId: string;
    pageId: string;
    pageVersionId: string;
  }): Promise<PublishedPageVersion>;
};

import type { PrismaClient } from '@prisma/client';

type PrismaLike = {
  pageVersion: {
    findFirst: PrismaClient['pageVersion']['findFirst'];
  };
};

export class PrismaPublishedPageKnowledgeSource implements PublishedPageKnowledgeSource {
  constructor(private readonly prisma: PrismaLike) {}

  async getPublishedPageVersion(input: {
    tenantId: string;
    pageId: string;
    pageVersionId: string;
  }): Promise<PublishedPageVersion> {
    const row = await this.prisma.pageVersion.findFirst({
      where: {
        tenantId: input.tenantId,
        pageId: input.pageId,
        id: input.pageVersionId,
        status: 'PUBLISHED',
        isDeleted: false,
      },
      select: {
        id: true,
        tenantId: true,
        pageId: true,
        title: true,
        content: true,
      },
    });

    if (!row) throw new Error('published page version not found');

    return {
      tenantId: row.tenantId,
      pageId: row.pageId,
      pageVersionId: row.id,
      title: row.title,
      content: row.content,
    };
  }
}
