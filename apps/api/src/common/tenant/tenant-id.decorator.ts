import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantRequest } from './tenant.middleware';

export const TenantId = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<TenantRequest>();
  const tenantId = req.tenantId;
  if (!tenantId) throw new BadRequestException('tenantId is missing');
  return tenantId;
});
