import type { PrismaClient } from '@prisma/client';
import type { AiMessageRepository } from '@contexta/domain';

export class PrismaAiMessageRepository implements AiMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: {
    tenantId: string;
    conversationId: string;
    role: 'SYSTEM' | 'USER' | 'ASSISTANT';
    content: string;
    model?: string | null;
    actorUserId: string;
  }) {
    return await this.prisma.aiMessage.create({
      data: {
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        model: params.model ?? null,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
    });
  }

  async listByConversation(params: {
    tenantId: string;
    conversationId: string;
    limit: number;
  }) {
    console.log(5555);
    const rows = await this.prisma.aiMessage.findMany({
      where: {
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    });

    return rows.reverse();
  }
}
