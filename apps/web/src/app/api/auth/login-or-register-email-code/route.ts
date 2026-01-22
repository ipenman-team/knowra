import { NextResponse } from 'next/server';
import { isValidEmail } from '@contexta/utils';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

function getApiBaseUrl(): string {
  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  return (base && base.trim().length > 0 ? base : 'http://localhost:3001').replace(/\/$/, '');
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('请求体不是合法 JSON', { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return new NextResponse('参数错误', { status: 400 });
  }

  const email = 'email' in body ? String((body as { email?: unknown }).email ?? '') : '';
  const channelRaw = 'channel' in body ? String((body as { channel?: unknown }).channel ?? '') : '';
  const recipientRaw =
    'recipient' in body ? String((body as { recipient?: unknown }).recipient ?? '') : '';
  const code = 'code' in body ? String((body as { code?: unknown }).code ?? '') : '';
  const typeRaw = 'type' in body ? String((body as { type?: unknown }).type ?? '') : '';
  const tenantKeyRaw =
    'tenantKey' in body ? String((body as { tenantKey?: unknown }).tenantKey ?? '') : '';

  const channel = (channelRaw || 'email').trim().toLowerCase();
  const recipient = (recipientRaw || email).trim();
  const trimmedCode = code.trim();
  const type = (typeRaw || 'login').trim().toLowerCase();
  const tenantKey = tenantKeyRaw.trim();

  if (channel === 'email' && !isValidEmail(recipient)) {
    return new NextResponse('邮箱格式不正确', { status: 400 });
  }
  if (!/^\d{6}$/.test(trimmedCode)) {
    return new NextResponse('验证码格式不正确', { status: 400 });
  }

  const upstream = await fetch(`${getApiBaseUrl()}/auth/login-or-register-by-code`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      recipient,
      code: trimmedCode,
      type,
      ...(tenantKey ? { tenantKey } : null),
    }),
  });

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : '登录失败，请稍后重试';
    return new NextResponse(message, { status: upstream.status });
  }

  const data = (await upstream.json().catch(() => null)) as
    | { token?: { accessToken?: unknown; expiresIn?: unknown }; user?: unknown; tenant?: unknown }
    | null;

  const accessToken = data?.token?.accessToken ? String(data.token.accessToken) : '';
  const expiresInRaw = data?.token?.expiresIn;
  const expiresIn = typeof expiresInRaw === 'number' ? expiresInRaw : Number(expiresInRaw ?? 0);
  if (!accessToken) {
    return new NextResponse('登录失败，请稍后重试', { status: 502 });
  }

  const res = NextResponse.json({ ok: true, user: data?.user ?? null, tenant: data?.tenant ?? null });
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Number.isFinite(expiresIn) && expiresIn > 0 ? Math.floor(expiresIn) : 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
