import type { CookieOptions, Request } from 'express';

export const ACCESS_TOKEN_COOKIE_NAME = 'ctxa_access_token';

export function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const normalizedProto =
    typeof proto === 'string' ? proto.split(',')[0]?.trim() : undefined;

  return req.secure || normalizedProto === 'https';
}

export function buildAccessTokenCookieOptions(
  req: Request,
  maxAge: number,
): CookieOptions {
  const isHttps = isHttpsRequest(req);

  return {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge,
    secure: isHttps,
  };
}
