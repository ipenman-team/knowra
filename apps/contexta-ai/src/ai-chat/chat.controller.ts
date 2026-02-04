import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AiConversationNotFoundError } from '@contexta/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { ChatService } from './chat.service';

type ChatBody = {
  conversationId?: unknown;
  message?: unknown;
  dataSource?: {
    spaceEnabled?: boolean;
    internetEnabled?: boolean;
    spaceIds?: string[];
  };
  // Backward compatible
  knowledge?: {
    enabled?: unknown;
    spaceId?: unknown;
  };
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

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: ChatBody,
  ): Promise<{ content: string; model: string }> {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const conversationId =
      typeof body?.conversationId === 'string' ? body.conversationId : '';
    const message = typeof body?.message === 'string' ? body.message : '';

    if (!conversationId.trim()) {
      throw new BadRequestException('conversationId is required');
    }
    if (!message.trim()) {
      throw new BadRequestException('message is required');
    }

    try {
      return await this.chatService.answer({
        tenantId,
        conversationId,
        message,
        actorUserId: userId,
        dataSource: body?.dataSource
          ? {
              internetEnabled: Boolean(body.dataSource.internetEnabled),
              spaceEnabled: Boolean(body.dataSource.spaceEnabled),
              spaceIds: normalizeSpaceIds(body.dataSource.spaceIds),
            }
          : undefined,
      });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        throw new NotFoundException('conversation not found');
      }
      throw err;
    }
  }

  @Post('stream')
  async stream(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: ChatBody,
    @Res() res: Response,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const conversationId =
      typeof body?.conversationId === 'string' ? body.conversationId : '';
    const message = typeof body?.message === 'string' ? body.message : '';

    if (!conversationId.trim()) {
      throw new BadRequestException('conversationId is required');
    }
    if (!message.trim()) {
      throw new BadRequestException('message is required');
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const controller = new AbortController();
    const onClose = () => controller.abort();
    res.req.on('close', onClose);
    res.req.on('aborted', onClose);

    try {
      const stream = this.chatService.answerStream({
        tenantId,
        conversationId,
        message,
        actorUserId: userId,
        signal: controller.signal,
      });

      for await (const delta of stream) {
        if (!delta) continue;
        writeEvent('delta', delta);
      }

      writeEvent('done', { ok: true });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        writeEvent('error', { message: 'conversation not found' });
      } else {
        const message = err instanceof Error ? err.message : 'stream error';
        writeEvent('error', { message });
      }
    } finally {
      res.end();
    }
  }
}
