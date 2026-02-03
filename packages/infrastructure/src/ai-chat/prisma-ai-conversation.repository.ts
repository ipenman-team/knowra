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
}
