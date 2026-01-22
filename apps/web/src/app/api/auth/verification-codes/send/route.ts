import { NextResponse } from 'next/server';

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

  const channel = 'channel' in body ? String((body as { channel?: unknown }).channel ?? '') : '';
  const recipient =
    'recipient' in body ? String((body as { recipient?: unknown }).recipient ?? '') : '';
  const type = 'type' in body ? String((body as { type?: unknown }).type ?? '') : '';

  const upstream = await fetch(`${getApiBaseUrl()}/auth/verification-codes/send`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ channel, recipient, type }),
  });

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : '发送失败，请稍后重试';
    return new NextResponse(message, { status: upstream.status });
  }

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data ?? { cooldownSeconds: 60 });
}
