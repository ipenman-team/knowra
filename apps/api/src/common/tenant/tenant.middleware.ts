import { Injectable, type NestMiddleware } from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export type TenantRequest = Request & {
  tenantId?: string;
  userId?: string;
  sessionId?: string;
};

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};

  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const rawValue = part.slice(idx + 1).trim();
    if (!rawValue) continue;
    out[key] = decodeURIComponent(rawValue);
  }
  return out;
}

function getBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;
  const m = /^Bearer\s+(.+)$/i.exec(trimmed);
  return m?.[1]?.trim() || null;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const cookies = parseCookies(req.headers.cookie);
    const token =
      getBearerToken(req.headers.authorization) ||
      (cookies.ctxa_access_token ? String(cookies.ctxa_access_token) : null);

    if (!token) {
      next();
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    try {
      const session = await this.prisma.authSession.findFirst({
        where: {
          tokenHash,
          isDeleted: false,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          userId: true,
          tenantId: true,
        },
      });

      if (session) {
        req.sessionId = session.id;
        req.userId = session.userId;
        req.tenantId = session.tenantId;
      }
    } catch {
      // ignore
    }

    next();
  }
}
