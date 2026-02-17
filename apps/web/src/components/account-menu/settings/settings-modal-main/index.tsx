'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldTitle,
} from '@/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { MeProfile, MeVerification } from '@/stores';
import { apiClient } from '@/lib/api';
import { messageService } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';

export const SettingsModalMain = memo(function SettingsModalMain({
  profile,
  verification,
}: {
  profile: MeProfile | null | undefined;
  verification: MeVerification | null | undefined;
}) {
  type SendVerificationCodeResponse = {
    cooldownSeconds?: number;
  };

  const phoneValue =
    profile?.phone?.trim() || verification?.phone.identifier?.trim() || '';
  const phoneBound = verification?.phone.bound ?? Boolean(phoneValue);
  const phoneVerified = verification?.phone.verified ?? false;

  const emailValue = verification?.email.identifier?.trim() || '';
  const emailBound = verification?.email.bound ?? Boolean(emailValue);
  const emailVerified = verification?.email.verified ?? false;

  const passwordSet = verification?.password.set ?? false;
  const canResetPassword = emailBound || phoneBound;

  const phoneStatusText = phoneBound
    ? phoneVerified
      ? phoneValue
      : '手机号未验证'
    : '未绑定手机号';
  const emailStatusText = emailBound
    ? emailVerified
      ? emailValue
      : '邮箱未验证'
    : '暂未绑定';
  const passwordStatusText = passwordSet
    ? '已设置，可通过账户密码登录'
    : '未设置密码，建议设置';
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [code, setCode] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNextPassword, setShowNextPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const normalizePassword = (value: string) => {
    return value.replace(/[^\x20-\x7E]/g, '');
  };

  const contactOptions = useMemo(
    () => [
      {
        value: 'email' as const,
        label: '邮箱',
        enabled: emailBound,
        contactValue: emailValue,
        placeholder: 'name@company.com',
      },
      {
        value: 'phone' as const,
        label: '手机号',
        enabled: phoneBound,
        contactValue: phoneValue,
        placeholder: '请输入手机号',
      },
    ],
    [emailBound, emailValue, phoneBound, phoneValue],
  );

  const defaultContactType = useMemo(() => {
    const firstEnabled = contactOptions.find((option) => option.enabled);
    return firstEnabled?.value ?? 'email';
  }, [contactOptions]);

  const canSendCode = useMemo(() => {
    if (sendingCode) return false;
    if (cooldown > 0) return false;
    if (!email.trim()) return false;
    return true;
  }, [cooldown, email, sendingCode]);

  const handleOpenReset = () => {
    setResetOpen(true);
    const nextContact = defaultContactType;
    const selected = contactOptions.find(
      (option) => option.value === nextContact,
    );
    setContactType(nextContact);
    setEmail(selected?.contactValue ?? '');
    setCode('');
    setNextPassword('');
    setConfirmPassword('');
    setSendError(null);
    setResetError(null);
    setCooldown(0);
  };

  useEffect(() => {
    if (!resetOpen) return;
    const selected = contactOptions.find(
      (option) => option.value === contactType && option.enabled,
    );
    if (selected) {
      setEmail(selected.contactValue ?? '');
      return;
    }
    const fallback = contactOptions.find((option) => option.enabled);
    if (fallback && fallback.value !== contactType) {
      setContactType(fallback.value);
      setEmail(fallback.contactValue ?? '');
    }
  }, [contactOptions, contactType, resetOpen]);

  const handleSendCode = async () => {
    if (!canSendCode) return;
    setSendError(null);
    setSendingCode(true);
    try {
      const trimmedEmail = email.trim();
      const { data } = await apiClient
        .post('/auth/verification-codes/send', {
          channel: contactType,
          recipient: trimmedEmail,
          type: 'reset_password',
        })
        .catch(() => ({ data: null }));

      const responseData =
        data && typeof data === 'object'
          ? (data as SendVerificationCodeResponse)
          : null;
      const cooldownSeconds =
        typeof responseData?.cooldownSeconds === 'number'
          ? responseData.cooldownSeconds
          : 60;

      setCooldown(Math.max(0, Math.floor(cooldownSeconds)));
      messageService.success('验证码已发送');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '发送失败，请稍后重试';
      setSendError(message);
      messageService.error('发送失败，请重试');
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4 sm:py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-6">
        <Item variant="muted">
          <ItemMedia variant="icon">
            {phoneVerified ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <AlertCircle className="text-amber-500" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>手机号</ItemTitle>
            <ItemDescription>{phoneStatusText}</ItemDescription>
          </ItemContent>
          <ItemActions className="w-full justify-end sm:w-auto">
            <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
              {phoneBound ? '更改' : '绑定'}
            </Button>
          </ItemActions>
        </Item>

        <Item variant="muted">
          <ItemMedia variant="icon">
            {emailVerified ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <AlertCircle className="text-amber-500" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>邮箱</ItemTitle>
            <ItemDescription>{emailStatusText}</ItemDescription>
          </ItemContent>
          <ItemActions className="w-full justify-end sm:w-auto">
            <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
              {emailBound ? '更改' : '绑定'}
            </Button>
          </ItemActions>
        </Item>

        <Item variant="muted">
          <ItemMedia variant="icon">
            {passwordSet ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <AlertCircle className="text-amber-500" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>账户密码</ItemTitle>
            <ItemDescription>{passwordStatusText}</ItemDescription>
          </ItemContent>
          <ItemActions className="w-full justify-end sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenReset}
              disabled={!canResetPassword}
              className="w-full sm:w-auto"
            >
              {passwordSet ? '重置密码' : '设置密码'}
            </Button>
          </ItemActions>
        </Item>
      </div>

      <Modal
        open={resetOpen}
        title="重置密码"
        onOpenChange={(open) => {
          setResetError(null);
          setResetOpen(open);
        }}
        confirmText={resetting ? '提交中…' : '提交'}
        confirmDisabled={resetting}
        onConfirm={async () => {
          setResetError(null);
          const trimmedEmail = email.trim();
          const trimmedCode = code.trim();
          const trimmedPassword = nextPassword.trim();
          const trimmedConfirm = confirmPassword.trim();

          if (!trimmedEmail) {
            setResetError(
              contactType === 'phone' ? '请输入手机号' : '请输入邮箱',
            );
            return;
          }
          if (!/^\d{6}$/.test(trimmedCode)) {
            setResetError('请输入 6 位验证码');
            return;
          }
          if (trimmedPassword.length < 8) {
            setResetError('密码至少 8 位');
            return;
          }
          if (trimmedPassword !== trimmedConfirm) {
            setResetError('两次输入的密码不一致');
            return;
          }

          setResetting(true);
          try {
            const res = await apiClient.post('/auth/password/reset', {
              recipient: trimmedEmail,
              code: trimmedCode,
              newPassword: trimmedPassword,
            });
            if (!res.data?.ok) {
              setResetError('重置失败，请稍后重试');
              return;
            }
            setResetOpen(false);
            messageService.success('密码设置成功');
          } catch (err) {
            const message =
              err && typeof err === 'object' && 'message' in err
                ? String((err as { message?: unknown }).message)
                : '重置失败，请稍后重试';
            setResetError(message);
          } finally {
            setResetting(false);
          }
        }}
        className="w-[calc(100vw-1rem)] max-w-[520px] max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6"
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldContent>
              <InputGroup>
                <InputGroupAddon>
                  <Select
                    value={contactType}
                    onValueChange={(value) => {
                      const selected = contactOptions.find(
                        (option) => option.value === value,
                      );
                      if (!selected || !selected.enabled) return;
                      setContactType(selected.value);
                      setEmail(selected.contactValue ?? '');
                      setSendError(null);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent px-0 shadow-none focus:ring-0">
                      <SelectValue placeholder="选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={!option.enabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </InputGroupAddon>
                <InputGroupInput
                  className="text-center"
                  value={email}
                  readOnly
                  placeholder={
                    contactOptions.find((option) => option.value === contactType)
                      ?.placeholder
                  }
                />
              </InputGroup>
            </FieldContent>
          </Field>

          <Field>
            <FieldContent>
              <FieldTitle>验证码</FieldTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canSendCode}
                  onClick={handleSendCode}
                  className="w-full sm:w-auto"
                >
                  {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                </Button>
              </div>
              {sendError ? <FieldError>{sendError}</FieldError> : null}
            </FieldContent>
          </Field>

          <Field>
            <FieldContent>
              <FieldTitle>新密码</FieldTitle>
              <div className="relative">
                <Input
                  type={showNextPassword ? 'text' : 'password'}
                  className="pr-10"
                  value={nextPassword}
                  onChange={(e) =>
                    setNextPassword(normalizePassword(e.target.value))
                  }
                  placeholder="请输入新密码"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowNextPassword((prev) => !prev)}
                  aria-label={showNextPassword ? '隐藏密码' : '显示密码'}
                >
                  {showNextPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FieldContent>
          </Field>

          <Field>
            <FieldContent>
              <FieldTitle>重复新密码</FieldTitle>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(normalizePassword(e.target.value))
                  }
                  placeholder="再次输入新密码"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? '隐藏密码' : '显示密码'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FieldContent>
          </Field>

          {resetError ? <FieldError>{resetError}</FieldError> : null}
        </FieldGroup>
      </Modal>
    </section>
  );
});
