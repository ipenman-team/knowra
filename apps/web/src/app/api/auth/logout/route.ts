import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

function getApiBaseUrl(): string {
  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  return (base && base.trim().length > 0 ? base : 'http://localhost:3001').replace(/\/$/, '');
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const value = part.slice(idx + 1).trim();
    if (!value) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export async function POST(req: Request) {
  const cookies = parseCookies(req.headers.get('cookie'));
  const token = cookies[ACCESS_TOKEN_COOKIE] ? String(cookies[ACCESS_TOKEN_COOKIE]) : '';

  if (token) {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
