import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { PermissionKey } from '@contexta/domain';
import { hasSpacePermission } from '@contexta/infrastructure';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantRequest } from '../tenant/tenant.middleware';

type ManagedPermission =
  | 'space.role.manage'
  | 'space.member.view'
  | 'space.member.invite'
  | 'space.member.remove'
  | 'space.member.role_change';

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  const next = trimmed.replace(/\/+$/g, '');
  return next || '/';
}

function getSpaceIdFromPath(path: string): string | null {
  const matched = /^\/spaces\/([^/]+)/.exec(path);
  return matched?.[1] ? decodeURIComponent(matched[1]) : null;
}

function resolvePermissionByRoute(
  method: string,
  path: string,
): ManagedPermission | null {
  const normalizedMethod = method.toUpperCase();

  if (/^\/spaces\/[^/]+\/roles(?:\/[^/]+)?$/.test(path)) {
    if (
      normalizedMethod === 'GET' ||
      normalizedMethod === 'POST' ||
      normalizedMethod === 'PUT' ||
      normalizedMethod === 'DELETE'
    ) {
      return 'space.role.manage';
    }
    return null;
  }

  if (/^\/spaces\/[^/]+\/members(?:\/.*)?$/.test(path)) {
    if (normalizedMethod === 'GET' && /^\/spaces\/[^/]+\/members$/.test(path)) {
      return 'space.member.view';
    }

    if (
      normalizedMethod === 'PUT' &&
      (/^\/spaces\/[^/]+\/members\/batch-role$/.test(path) ||
        /^\/spaces\/[^/]+\/members\/[^/]+\/role$/.test(path))
    ) {
      return 'space.member.role_change';
    }

    if (
      (normalizedMethod === 'DELETE' &&
        /^\/spaces\/[^/]+\/members\/[^/]+$/.test(path)) ||
      (normalizedMethod === 'POST' &&
        /^\/spaces\/[^/]+\/members\/batch-remove$/.test(path))
    ) {
      return 'space.member.remove';
    }

    return null;
  }

  if (/^\/spaces\/[^/]+\/invitations(?:\/.*)?$/.test(path)) {
    if (normalizedMethod === 'GET' || normalizedMethod === 'POST') {
      return 'space.member.invite';
    }
    return null;
  }

  return null;
}

@Injectable()
export class SpacePermissionMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const path = normalizePath(req.path || req.originalUrl || '');
    const requiredPermission = resolvePermissionByRoute(req.method || 'GET', path);

    if (!requiredPermission) {
      next();
      return;
    }

    if (!req.tenantId || !req.userId) {
      throw new UnauthorizedException('unauthorized');
    }

    const spaceId = getSpaceIdFromPath(path);
    if (!spaceId) {
      throw new ForbiddenException('forbidden');
    }

    const allowed = await hasSpacePermission(this.prisma, {
      tenantId: req.tenantId,
      spaceId,
      userId: req.userId,
      permission: requiredPermission as PermissionKey,
    });

    if (!allowed) {
      throw new ForbiddenException('forbidden');
    }

    next();
  }
}

export const __spacePermissionMiddlewareInternals = {
  normalizePath,
  getSpaceIdFromPath,
  resolvePermissionByRoute,
};
