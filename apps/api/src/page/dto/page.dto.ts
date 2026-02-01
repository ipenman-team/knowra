import type { Prisma } from '@prisma/client';

export type PageDto = {
  id: string;
  tenantId: string;
  spaceId: string;
  title: string;
  content: Prisma.JsonValue;
  parentIds: string[];

  // Pointer to latest published page version (nullable until first publish)
  latestPublishedVersionId: string | null;

  createdAt: Date;
  updatedAt: Date;
};
