import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AppLocale } from './locale.constants';
import { resolveRequestLocale } from './locale.utils';

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  use(
    req: Request & { locale?: AppLocale },
    _res: Response,
    next: NextFunction,
  ) {
    req.locale = resolveRequestLocale({
      locale: req.locale,
      cookieHeader: req.headers.cookie,
      acceptLanguage: req.headers['accept-language'],
    });
    next();
  }
}
