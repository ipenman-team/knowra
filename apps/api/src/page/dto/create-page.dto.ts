import type { Prisma } from '@prisma/client';

export type CreatePageDto = {
  spaceId: string;
  title: string;
  content?: Prisma.JsonValue;
  parentIds?: string[];
};
