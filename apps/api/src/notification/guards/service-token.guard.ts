import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

function sha256(input: string): Buffer {
  return createHash('sha256').update(input).digest();
}

function getHeaderString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const actual = getHeaderString(req.headers['x-service-token']);
    const expected = process.env.INTERNAL_SERVICE_TOKEN ?? '';

    if (!actual || !expected) return false;

    return timingSafeEqual(sha256(actual), sha256(expected));
  }
}
