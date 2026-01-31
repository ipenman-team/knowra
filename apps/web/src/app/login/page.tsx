'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { EmailCodeLoginForm } from './components/email-code-login-form';
import { LoginHeader } from './components/login-header';
import { LoginOtherMethods } from './components/login-other-methods';
import { LoginTabs } from './components/login-tabs';
import { PasswordLoginForm } from './components/password-login-form';

export default function LoginPage() {
  const [mode, setMode] = useState<'code' | 'password'>('code');
  const subtitle =
    mode === 'code' ? '使用邮箱验证码快速登录' : '使用账号密码登录';

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader className="items-center text-center">
            <LoginHeader subtitle={subtitle} />
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <LoginTabs value={mode} onChange={setMode} />
              {mode === 'code' ? <EmailCodeLoginForm /> : <PasswordLoginForm />}
            </div>
          </CardContent>
        </Card>

        <LoginOtherMethods />
      </div>
    </div>
  );
}
