'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, toDigits } from '@contexta/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sentHint, setSentHint] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const canSendCode = useMemo(() => {
    if (sending) return false;
    if (cooldown > 0) return false;
    return isValidEmail(email.trim());
  }, [cooldown, email, sending]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!agreed) return false;
    if (!isValidEmail(email.trim())) return false;
    if (!/^\d{6}$/.test(code.trim())) return false;
    return true;
  }, [agreed, code, email, submitting]);

  const handleSendCode = useCallback(async () => {
    setApiError(null);
    setEmailError(null);
    setCodeError(null);
    setAgreeError(null);
    setSentHint(null);

    if (!isValidEmail(email)) {
      setEmailError('请输入正确的邮箱地址');
      return;
    }

    setSending(true);
    try {
      const trimmedEmail = email.trim();
      const res = await fetch('/api/auth/verification-codes/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: 'email', recipient: trimmedEmail, type: 'login' }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setApiError(text || '发送失败，请稍后重试');
        return;
      }

      const data = (await res.json().catch(() => null)) as null | {
        cooldownSeconds?: unknown;
      };

      const cooldownSeconds =
        data && typeof data === 'object' && typeof data.cooldownSeconds === 'number'
          ? data.cooldownSeconds
          : 60;

      setSentHint('验证码已发送');
      setCooldown(Math.max(0, Math.floor(cooldownSeconds)));
    } finally {
      setSending(false);
    }
  }, [email]);

  const handleSubmit = useCallback(async () => {
    setApiError(null);
    setEmailError(null);
    setCodeError(null);
    setAgreeError(null);

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    let ok = true;
    if (!agreed) {
      setAgreeError('请先同意服务协议和隐私政策');
      ok = false;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('请输入正确的邮箱地址');
      ok = false;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setCodeError('请输入 6 位验证码');
      ok = false;
    }
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login-or-register-email-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: 'email', recipient: trimmedEmail, code: trimmedCode, type: 'login' }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setApiError(text || '登录失败，请稍后重试');
        return;
      }

      router.replace('/');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }, [agreed, code, email, router]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary" aria-hidden="true" />
              <span className="text-lg font-semibold">Contexta</span>
            </div>
            <CardTitle className="text-2xl">欢迎使用 Contexta</CardTitle>
            <div className="text-sm text-muted-foreground">使用邮箱验证码快速登录</div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                    setApiError(null);
                  }}
                  placeholder="name@company.com"
                  inputMode="email"
                  autoComplete="email"
                  className={cn(
                    'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    emailError ? 'border-destructive' : 'border-input'
                  )}
                  disabled={submitting || sending}
                />
                {emailError ? (
                  <div className="text-xs text-destructive">{emailError}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">验证码</label>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(toDigits(e.target.value, 6));
                      setCodeError(null);
                      setApiError(null);
                    }}
                    placeholder="6 位验证码"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={cn(
                      'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      codeError ? 'border-destructive' : 'border-input'
                    )}
                  disabled={submitting || sending}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-[120px]"
                    disabled={!canSendCode}
                    onClick={() => void handleSendCode()}
                  >
                    {cooldown > 0 ? `重新发送(${cooldown}s)` : '获取验证码'}
                  </Button>
                </div>
                {codeError ? (
                  <div className="text-xs text-destructive">{codeError}</div>
                ) : sentHint ? (
                  <div className="text-xs text-muted-foreground">{sentHint}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      setAgreeError(null);
                      setApiError(null);
                    }}
                    className="mt-1 h-4 w-4"
                  disabled={submitting || sending}
                  />
                  <div className="text-sm text-muted-foreground">
                    我已阅读并同意 Contexta{' '}
                    <a className="text-foreground underline" href="#">服务协议</a>
                    {' '}和{' '}
                    <a className="text-foreground underline" href="#">隐私权政策</a>
                  </div>
                </div>
                {agreeError ? <div className="text-xs text-destructive">{agreeError}</div> : null}
              </div>

              {apiError ? <div className="text-sm text-destructive">{apiError}</div> : null}

              <Button
                type="button"
                className="h-10 w-full"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? '登录中…' : '登录 / 注册'}
              </Button>

              <div className="pt-4 text-center text-xs text-muted-foreground">
                中文 / English · <a href="#" className="hover:text-foreground">遇到问题</a>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          其他登录方式（敬请期待）
          <div className="mt-3 flex justify-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/30 text-xs"
              aria-label="微信扫码登录（敬请期待）"
              title="微信扫码登录（敬请期待）"
              disabled
            >
              微
            </button>
            {Array.from({ length: 3 }).map((_, i) => (
              <button
                key={i}
                type="button"
                className="h-9 w-9 rounded-full border bg-muted/30"
                aria-label="其他登录方式（敬请期待）"
                disabled
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
