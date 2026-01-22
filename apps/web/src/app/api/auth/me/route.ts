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

export async function GET(req: Request) {
  const cookies = parseCookies(req.headers.get('cookie'));
  const token = cookies[ACCESS_TOKEN_COOKIE] ? String(cookies[ACCESS_TOKEN_COOKIE]) : '';
  if (!token) return new NextResponse('unauthorized', { status: 401 });

  const upstream = await fetch(`${getApiBaseUrl()}/auth/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : '请求失败';
    return new NextResponse(message, { status: upstream.status });
  }

  return NextResponse.json(payload ?? { ok: true, user: null, profile: null, tenant: null });
}

