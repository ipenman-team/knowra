import { NextResponse } from 'next/server';

const MOCK_AUTH_COOKIE = 'ctxa_mock_auth';

function isValidEmail(value: string) {
  const v = value.trim();
  if (v.length < 3) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
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
  const code = 'code' in body ? String((body as { code?: unknown }).code ?? '') : '';
  const trimmedEmail = email.trim();
  const trimmedCode = code.trim();

  if (!isValidEmail(trimmedEmail)) {
    return new NextResponse('邮箱格式不正确', { status: 400 });
  }
  if (!/^\d{6}$/.test(trimmedCode)) {
    return new NextResponse('验证码格式不正确', { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_AUTH_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

