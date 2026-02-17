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
import { localizeErrorMessage } from '../common/i18n/error-message.mapper';
import { resolveRequestLocale } from '../common/i18n/locale.utils';

type ChatBody = {
  conversationId?: unknown;
  message?: unknown;
  attachmentIds?: unknown;
  // Backward compatible
  knowledge?: {
    enabled?: unknown;
    spaceId?: unknown;
  };
};

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
    const attachmentIds = Array.isArray(body?.attachmentIds)
      ? body?.attachmentIds
          .filter((x) => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
      : [];

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
        attachmentIds,
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
    const attachmentIds = Array.isArray(body?.attachmentIds)
      ? body?.attachmentIds
          .filter((x) => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
      : [];

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
    const locale = resolveRequestLocale({
      cookieHeader: res.req.headers.cookie,
      acceptLanguage: res.req.headers['accept-language'],
    });

    try {
      const stream = await this.chatService.answerStream({
        tenantId,
        conversationId,
        message,
        actorUserId: userId,
        signal: controller.signal,
        attachmentIds,
      });

      for await (const delta of stream) {
        if (!delta) continue;
        writeEvent('delta', delta);
      }

      writeEvent('done', { ok: true });
    } catch (err) {
      if (err instanceof AiConversationNotFoundError) {
        const localized = localizeErrorMessage(
          'conversation not found',
          locale,
        );
        writeEvent('error', {
          message: localized.message,
          errorCode: localized.errorCode,
        });
      } else {
        const rawMessage = err instanceof Error ? err.message : 'stream error';
        const localized = localizeErrorMessage(rawMessage, locale);
        writeEvent('error', {
          message: localized.message,
          errorCode: localized.errorCode,
        });
      }
    } finally {
      res.end();
    }
  }
}
