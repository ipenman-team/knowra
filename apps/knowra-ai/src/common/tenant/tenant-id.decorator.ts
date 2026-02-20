import {
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { TenantRequest } from './tenant.middleware';

export const TenantId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedException('unauthorized');
    return tenantId;
  },
);

export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return req.userId;
  },
);

export const SessionId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return req.sessionId;
  },
);
