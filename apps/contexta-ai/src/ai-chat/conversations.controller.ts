import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AiConversationNotFoundError,
} from '@contexta/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { AiConversation, AiMessage } from '@contexta/domain';

type CreateConversationBody = {
  title?: string;
};

@Controller('api/conversations')
export class ConversationsController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateConversationBody,
  ): Promise<AiConversation> {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const title = typeof body?.title === 'string' ? body.title : undefined;
    return await this.conversationService.create({
      tenantId,
      title,
      actorUserId: userId,
    });
  }

  @Get()
  async list(
    @TenantId() tenantId: string,
    @Query('limit') limit: string | undefined,
  ): Promise<AiConversation[]> {
    const parsedLimit = limit ? Number(limit) : undefined;
    return await this.conversationService.list({
      tenantId,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Get(':id/messages')
  async messages(
    @TenantId() tenantId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit: string | undefined,
  ): Promise<AiMessage[]> {
    const parsedLimit = limit ? Number(limit) : undefined;
    try {
      return await this.messageService.listByConversation({
        tenantId,
        conversationId,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        throw new NotFoundException('conversation not found');
      }
      throw err;
    }
  }
}
