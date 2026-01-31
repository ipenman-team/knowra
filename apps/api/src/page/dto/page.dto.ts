import type { Prisma } from '@prisma/client';

export type PageDto = {
  id: string;
  tenantId: string;
  spaceId: string;
  title: string;
  content: Prisma.JsonValue;
  parentIds: string[];
  createdAt: Date;
  updatedAt: Date;
};
