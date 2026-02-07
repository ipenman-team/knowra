import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AiConversation,
  AiConversationDataSource,
  AiConversationRepository,
} from '@contexta/domain';
import { InputJsonValue } from '@prisma/client/runtime/library';

function normalizeSpaceIds(spaceIds: unknown): string[] {
  if (!Array.isArray(spaceIds)) return [];
  const uniq = new Set<string>();
  for (const raw of spaceIds) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
}

function normalizeDataSource(raw: unknown): AiConversationDataSource {
  const obj =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const internetEnabled =
    obj.internetEnabled === undefined ? true : Boolean(obj.internetEnabled);
  const spaceEnabled =
    obj.spaceEnabled === undefined ? false : Boolean(obj.spaceEnabled);
  const carryContext =
    obj.carryContext === undefined ? true : Boolean(obj.carryContext);

  return {
    ...obj,
    internetEnabled,
    spaceEnabled,
    spaceIds: spaceEnabled ? normalizeSpaceIds(obj.spaceIds) : [],
    carryContext,
  };
}

function toDomain(row: {
  id: string;
  tenantId: string;
  title: string;
  dataSource: Prisma.JsonValue | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AiConversation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    dataSource: normalizeDataSource(row.dataSource),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaAiConversationRepository implements AiConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: {
    tenantId: string;
    title: string;
    actorUserId: string;
  }) {
    const created = await this.prisma.aiConversation.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        dataSource: {
          internetEnabled: true,
          spaceEnabled: false,
          spaceIds: [],
          carryContext: true,
        },
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });

    return toDomain(created);
  }

  async list(params: { tenantId: string; limit: number }) {
    const rows = await this.prisma.aiConversation.findMany({
      where: {
        tenantId: params.tenantId,
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: params.limit,
    });

    return rows.map(toDomain);
  }

  async getById(params: { tenantId: string; conversationId: string }) {
    const row = await this.prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
    });

    return row ? toDomain(row) : null;
  }

  async renameTitle(params: {
    tenantId: string;
    conversationId: string;
    title: string;
    actorUserId: string;
  }) {
    // NOTE: tenant isolation is ensured by an existence check in application layer.
    const updated = await this.prisma.aiConversation.update({
      where: { id: params.conversationId },
      data: {
        title: params.title,
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      },
    });

    return toDomain(updated);
  }

  async updateSources(params: {
    tenantId: string;
    conversationId: string;
    dataSource: AiConversationDataSource;
    actorUserId: string;
  }) {
    await this.prisma.aiConversation.updateMany({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      data: {
        dataSource: params.dataSource as InputJsonValue,
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      },
    });

    const updated = await this.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!updated) {
      throw new Error('conversation not found');
    }
    return updated;
  }

  async delete(params: {
    tenantId: string;
    conversationId: string;
    actorUserId: string;
  }): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.aiMessage.updateMany({
        where: {
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          updatedBy: params.actorUserId,
          updatedAt: now,
        },
      }),
      this.prisma.aiConversation.updateMany({
        where: {
          id: params.conversationId,
          tenantId: params.tenantId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          updatedBy: params.actorUserId,
          updatedAt: now,
        },
      }),
    ]);
  }

  async touch(params: {
    tenantId: string;
    conversationId: string;
    actorUserId: string;
  }): Promise<void> {
    await this.prisma.aiConversation.updateMany({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      data: {
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      },
    });
  }
}
