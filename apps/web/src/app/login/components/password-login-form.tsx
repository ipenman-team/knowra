import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidE164, isValidEmail } from '@contexta/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

import { LoginAgreement } from './login-agreement';
import { LoginSupportLinks } from './login-support-links';

export function PasswordLoginForm() {
  const router = useRouter();

  const normalizePassword = useCallback((value: string) => {
    return value.replace(/[^\x20-\x7E]/g, '');
  }, []);

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!agreed) return false;
    const trimmed = account.trim();
    if (!trimmed) return false;
    if (!isValidEmail(trimmed) && !isValidE164(trimmed)) return false;
    if (password.trim().length < 8) return false;
    return true;
  }, [account, agreed, password, submitting]);

  const handleSubmit = useCallback(async () => {
    setApiError(null);
    setAccountError(null);
    setPasswordError(null);
    setAgreeError(null);

    const trimmedAccount = account.trim();
    const trimmedPassword = password.trim();

    let ok = true;
    if (!agreed) {
      setAgreeError('请先同意服务协议和隐私政策');
      ok = false;
    }
    if (!trimmedAccount) {
      setAccountError('请输入邮箱或手机号');
      ok = false;
    } else if (!isValidEmail(trimmedAccount) && !isValidE164(trimmedAccount)) {
      setAccountError('请输入正确的邮箱或手机号');
      ok = false;
    }
    if (trimmedPassword.length < 8) {
      setPasswordError('密码至少 8 位');
      ok = false;
    }
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post('/auth/login-by-password', {
        account: trimmedAccount,
        password: trimmedPassword,
      });

      if (!res.data.ok) {
        setApiError('登录失败，请稍后重试');
        return;
      }

      router.replace('/workbench');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }, [account, agreed, password, router]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">账号</label>
        <Input
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            setAccountError(null);
            setApiError(null);
          }}
          placeholder="邮箱或手机号"
          inputMode="email"
          autoComplete="username"
          className={cn(
            'h-10 w-full text-sm ring-offset-background',
            accountError ? 'border-destructive' : 'border-input',
          )}
          disabled={submitting}
        />
        {accountError ? (
          <div className="text-xs text-destructive">{accountError}</div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">密码</label>
        <div className="relative">
          <Input
            value={password}
            onChange={(e) => {
              setPassword(normalizePassword(e.target.value));
              setPasswordError(null);
              setApiError(null);
            }}
            placeholder="请输入密码"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={cn(
              'h-10 w-full pr-10 text-sm ring-offset-background',
              passwordError ? 'border-destructive' : 'border-input',
            )}
            disabled={submitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            disabled={submitting}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {passwordError ? (
          <div className="text-xs text-destructive">{passwordError}</div>
        ) : null}
      </div>

      <LoginAgreement
        agreed={agreed}
        onChange={(value) => {
          setAgreed(value);
          setAgreeError(null);
          setApiError(null);
        }}
        disabled={submitting}
        error={agreeError}
      />

      {apiError ? <div className="text-sm text-destructive">{apiError}</div> : null}

      <Button
        type="button"
        className="h-10 w-full"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        {submitting ? '登录中…' : '登录'}
      </Button>

      <LoginSupportLinks />
    </div>
  );
}
