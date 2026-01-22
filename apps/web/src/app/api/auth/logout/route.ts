import { NextResponse } from 'next/server';

const MOCK_AUTH_COOKIE = 'ctxa_mock_auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

