import type { ExecutionContext } from '@nestjs/common';
import { ServiceTokenGuard } from '../../guards/service-token.guard';

describe('ServiceTokenGuard', () => {
  const guard = new ServiceTokenGuard();
  const original = process.env.INTERNAL_SERVICE_TOKEN;

  afterEach(() => {
    process.env.INTERNAL_SERVICE_TOKEN = original;
  });

  function makeContext(token?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-service-token': token } }),
      }),
    } as unknown as ExecutionContext;
  }

  test('returns true when token matches', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'abc123';
    expect(guard.canActivate(makeContext('abc123'))).toBe(true);
  });

  test('returns false when token mismatch', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'abc123';
    expect(guard.canActivate(makeContext('abc124'))).toBe(false);
  });

  test('returns false when env token is empty', () => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
    expect(guard.canActivate(makeContext('abc123'))).toBe(false);
  });
});
