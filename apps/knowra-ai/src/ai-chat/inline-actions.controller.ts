import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { InlineActionType } from '@knowra/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { localizeErrorMessage } from '../common/i18n/error-message.mapper';
import { resolveRequestLocale } from '../common/i18n/locale.utils';
import { InlineActionsService } from './inline-actions.service';

const INLINE_ACTION_TYPES: InlineActionType[] = [
  'rewrite',
  'condense',
  'expand',
  'summarize',
  'translate',
  'qa',
  'custom',
];

const INLINE_ACTION_TYPE_SET = new Set<InlineActionType>(INLINE_ACTION_TYPES);

type InlineActionsBody = {
  selectedText?: unknown;
  actionType?: unknown;
  userPrompt?: unknown;
  actionParams?: {
    targetLanguage?: unknown;
  };
  context?: {
    pageId?: unknown;
    spaceId?: unknown;
    mode?: unknown;
  };
};

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeContextMode(value: unknown): 'edit' | 'readonly' | undefined {
  if (value === 'edit' || value === 'readonly') return value;
  return undefined;
}

@Controller('api/inline-actions')
export class InlineActionsController {
  constructor(private readonly inlineActionsService: InlineActionsService) {}

  @Post('stream')
  async stream(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: InlineActionsBody,
    @Res() res: Response,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const selectedText = normalizeOptionalString(body?.selectedText);
    if (!selectedText) throw new BadRequestException('selectedText is required');

    const actionTypeRaw = normalizeOptionalString(body?.actionType);
    if (!actionTypeRaw) throw new BadRequestException('actionType is required');

    if (!INLINE_ACTION_TYPE_SET.has(actionTypeRaw as InlineActionType)) {
      throw new BadRequestException('actionType invalid');
    }
    const actionType = actionTypeRaw as InlineActionType;

    const userPrompt = normalizeOptionalString(body?.userPrompt);
    const targetLanguage = normalizeOptionalString(body?.actionParams?.targetLanguage);
    const contextMode = normalizeContextMode(body?.context?.mode);
    if (body?.context?.mode !== undefined && !contextMode) {
      throw new BadRequestException('context.mode invalid');
    }

    const pageId = normalizeOptionalString(body?.context?.pageId);
    const spaceId = normalizeOptionalString(body?.context?.spaceId);

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
      const stream = this.inlineActionsService.stream({
        tenantId,
        actorUserId: userId,
        selectedText,
        actionType,
        userPrompt,
        actionParams: {
          targetLanguage,
        },
        context: {
          pageId,
          spaceId,
          mode: contextMode ?? 'edit',
        },
        signal: controller.signal,
      });

      for await (const delta of stream) {
        if (!delta) continue;
        writeEvent('delta', delta);
      }

      writeEvent('done', { ok: true });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'stream error';
      const localized = localizeErrorMessage(rawMessage, locale);
      writeEvent('error', {
        message: localized.message,
        errorCode: localized.errorCode,
      });
    } finally {
      res.end();
    }
  }
}
