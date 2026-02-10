import type { Prisma } from '@prisma/client';

export type SavePageDto = {
  title?: string;
  content?: Prisma.JsonValue;
  parentIds?: string[];
  publish?: boolean;
};
