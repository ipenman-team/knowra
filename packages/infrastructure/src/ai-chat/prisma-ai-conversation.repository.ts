import type { PrismaClient } from '@prisma/client';
import type { AiConversationRepository } from '@contexta/domain';

export class PrismaAiConversationRepository implements AiConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: {
    tenantId: string;
    title: string;
    actorUserId: string;
  }) {
    return await this.prisma.aiConversation.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });
  }

  async list(params: { tenantId: string; limit: number }) {
    return await this.prisma.aiConversation.findMany({
      where: {
        tenantId: params.tenantId,
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: params.limit,
    });
  }

  async getById(params: { tenantId: string; conversationId: string }) {
    return await this.prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
    });
  }

  async renameTitle(params: {
    tenantId: string;
    conversationId: string;
    title: string;
    actorUserId: string;
  }) {
    // NOTE: tenant isolation is ensured by an existence check in application layer.
    return await this.prisma.aiConversation.update({
      where: { id: params.conversationId },
      data: {
        title: params.title,
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      },
    });
  }

  async updateSources(params: {
    tenantId: string;
    conversationId: string;
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    actorUserId: string;
  }) {
    await this.prisma.aiConversation.updateMany({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      data: {
        internetEnabled: params.internetEnabled,
        spaceEnabled: params.spaceEnabled,
        spaceIds: params.spaceIds,
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
