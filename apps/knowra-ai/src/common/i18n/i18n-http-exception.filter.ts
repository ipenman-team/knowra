import {
  Catch,
  HttpException,
  type ExceptionFilter,
  type ArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AppLocale } from './locale.constants';
import { localizeErrorMessage } from './error-message.mapper';
import { resolveRequestLocale } from './locale.utils';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeErrorBody(
  body: unknown,
  statusCode: number,
  fallbackMessage: string,
): Record<string, unknown> {
  if (isRecord(body)) return { ...body };
  if (typeof body === 'string') {
    return { statusCode, message: body };
  }
  return { statusCode, message: fallbackMessage };
}

function extractMessage(
  body: Record<string, unknown>,
  fallback: string,
): string {
  const current = body.message;
  if (typeof current === 'string') return current;
  if (Array.isArray(current) && current.length > 0) {
    return String(current[0]);
  }
  return fallback;
}

@Catch(HttpException)
export class I18nHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { locale?: AppLocale }>();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const responseBody = exception.getResponse();

    const payload = normalizeErrorBody(responseBody, status, exception.message);
    const rawMessage = extractMessage(payload, exception.message);
    const locale = resolveRequestLocale({
      locale: req.locale,
      cookieHeader: req.headers.cookie,
      acceptLanguage: req.headers['accept-language'],
    });
    const localized = localizeErrorMessage(rawMessage, locale);

    payload.message = localized.message;
    if (localized.errorCode && typeof payload.errorCode !== 'string') {
      payload.errorCode = localized.errorCode;
    }

    res.status(status).json(payload);
  }
}
