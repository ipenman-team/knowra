import {
  BadRequestException,
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

type RenameConversationBody = {
  title?: unknown;
};

type ConversationSourcesBody = {
  internetEnabled?: unknown;
  spaceEnabled?: unknown;
  spaceIds?: unknown;
  carryContext?: unknown;
};

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

  @Post(':id/rename')
  async rename(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') conversationId: string,
    @Body() body: RenameConversationBody,
  ): Promise<AiConversation> {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const title = typeof body?.title === 'string' ? body.title : '';
    try {
      return await this.conversationService.renameTitle({
        tenantId,
        conversationId,
        title,
        actorUserId: userId,
      });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        throw new NotFoundException('conversation not found');
      }
      throw err;
    }
  }

  @Get(':id/sources')
  async getSources(
    @TenantId() tenantId: string,
    @Param('id') conversationId: string,
  ): Promise<{ internetEnabled: boolean; spaceEnabled: boolean; spaceIds: string[]; carryContext: boolean }> {
    try {
      return await this.conversationService.getSources({
        tenantId,
        conversationId,
      });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        throw new NotFoundException('conversation not found');
      }
      throw err;
    }
  }

  @Post(':id/sources')
  async updateSources(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') conversationId: string,
    @Body() body: ConversationSourcesBody,
  ): Promise<{ internetEnabled: boolean; spaceEnabled: boolean; spaceIds: string[]; carryContext: boolean }> {
    if (!userId) throw new UnauthorizedException('unauthorized');

    if (typeof body?.internetEnabled !== 'boolean') {
      throw new BadRequestException('internetEnabled must be boolean');
    }
    if (typeof body?.spaceEnabled !== 'boolean') {
      throw new BadRequestException('spaceEnabled must be boolean');
    }

    if (body?.carryContext !== undefined && typeof body?.carryContext !== 'boolean') {
      throw new BadRequestException('carryContext must be boolean');
    }

    const spaceIds = normalizeSpaceIds(body?.spaceIds);
    const carryContext =
      typeof body?.carryContext === 'boolean' ? body.carryContext : undefined;

    try {
      return await this.conversationService.updateSources({
        tenantId,
        conversationId,
        internetEnabled: body.internetEnabled,
        spaceEnabled: body.spaceEnabled,
        spaceIds,
        carryContext,
        actorUserId: userId,
      });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        throw new NotFoundException('conversation not found');
      }
      throw err;
    }
  }
}
