import type { NextFunction, Request, Response } from 'express';

export type TenantRequest = Request & { tenantId?: string };

export function tenantMiddleware(req: TenantRequest, _res: Response, next: NextFunction) {
  // 临时方案：先写死 tenantId。
  // 未来可由鉴权中间件/guard 在每次请求中注入。
  req.tenantId = process.env.TENANT_ID ?? 't1';
  next();
}
