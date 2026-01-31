"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { MeProfile, MeVerification } from "@/stores";
import { apiClient } from "@/lib/api";

export const SettingsModalMain = memo(function SettingsModalMain({
  profile,
  verification,
}: {
  profile: MeProfile | null | undefined;
  verification: MeVerification | null | undefined;
}) {
  const phoneValue =
    profile?.phone?.trim() ||
    verification?.phone.identifier?.trim() ||
    "";
  const phoneBound = verification?.phone.bound ?? Boolean(phoneValue);
  const phoneVerified = verification?.phone.verified ?? false;

  const emailValue = verification?.email.identifier?.trim() || "";
  const emailBound = verification?.email.bound ?? Boolean(emailValue);
  const emailVerified = verification?.email.verified ?? false;

  const passwordSet = verification?.password.set ?? false;

  const phoneStatusText = phoneBound
    ? phoneVerified
      ? phoneValue
      : "手机号未验证"
    : "未绑定手机号";
  const emailStatusText = emailBound
    ? emailVerified
      ? emailValue
      : "邮箱未验证"
    : "暂未绑定";
  const passwordStatusText = passwordSet
    ? "已设置，可通过账户密码登录"
    : "未设置密码，建议设置";
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const canSendCode = useMemo(() => {
    if (sendingCode) return false;
    if (cooldown > 0) return false;
    if (!email.trim()) return false;
    return true;
  }, [cooldown, email, sendingCode]);

  const handleOpenReset = () => {
    setResetOpen(true);
    setEmail("");
    setCode("");
    setNextPassword("");
    setConfirmPassword("");
    setSendError(null);
    setResetError(null);
    setCooldown(0);
  };

  const handleSendCode = async () => {
    if (!canSendCode) return;
    setSendError(null);
    setSendingCode(true);
    try {
      const trimmedEmail = email.trim();
      const { data } = await apiClient
        .post("/auth/verification-codes/send", {
          channel: "email",
          recipient: trimmedEmail,
          type: "reset_password",
        })
        .catch(() => ({ data: null }));

      const cooldownSeconds =
        data && typeof data === "object" && typeof (data as any).cooldownSeconds === "number"
          ? (data as any).cooldownSeconds
          : 60;

      setCooldown(Math.max(0, Math.floor(cooldownSeconds)));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "发送失败，请稍后重试";
      setSendError(message);
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
    <section className="flex-1 px-8 py-6">
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
            <ItemDescription>
              {phoneStatusText}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" disabled>
              {phoneBound ? "更改" : "绑定"}
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
          <ItemActions>
            <Button size="sm" variant="outline" disabled>
              {emailBound ? "更改" : "绑定"}
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
          <ItemActions>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenReset}
              disabled={!emailBound}
            >
              {passwordSet ? "重置密码" : "设置密码"}
            </Button>
          </ItemActions>
        </Item>
      </div>

      <Modal
        open={resetOpen}
        title="邮箱重置密码"
        onOpenChange={(open) => {
          setResetError(null);
          setResetOpen(open);
        }}
        confirmText={resetting ? "提交中…" : "提交"}
        confirmDisabled={resetting}
        onConfirm={async () => {
          setResetError(null);
          const trimmedEmail = email.trim();
          const trimmedCode = code.trim();
          const trimmedPassword = nextPassword.trim();
          const trimmedConfirm = confirmPassword.trim();

          if (!trimmedEmail) {
            setResetError("请输入邮箱");
            return;
          }
          if (!/^\d{6}$/.test(trimmedCode)) {
            setResetError("请输入 6 位验证码");
            return;
          }
          if (trimmedPassword.length < 8) {
            setResetError("密码至少 8 位");
            return;
          }
          if (trimmedPassword !== trimmedConfirm) {
            setResetError("两次输入的密码不一致");
            return;
          }

          setResetting(true);
          try {
            const res = await apiClient.post("/auth/password/reset", {
              recipient: trimmedEmail,
              code: trimmedCode,
              newPassword: trimmedPassword,
            });
            if (!res.data?.ok) {
              setResetError("重置失败，请稍后重试");
              return;
            }
            setResetOpen(false);
          } catch (err) {
            const message =
              err && typeof err === "object" && "message" in err
                ? String((err as { message?: unknown }).message)
                : "重置失败，请稍后重试";
            setResetError(message);
          } finally {
            setResetting(false);
          }
        }}
        className="w-[520px]"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">邮箱</div>
            <input
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">验证码</div>
              <div className="flex gap-2">
                <input
                  className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canSendCode}
                  onClick={handleSendCode}
                >
                  {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
                </Button>
              </div>
              {sendError ? (
                <div className="text-xs text-destructive">{sendError}</div>
              ) : null}
            </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">新密码</div>
            <input
              type="password"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={nextPassword}
              onChange={(e) => setNextPassword(e.target.value)}
              placeholder="请输入新密码"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">重复新密码</div>
            <input
              type="password"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
            />
          </div>
          {resetError ? (
            <div className="text-xs text-destructive">{resetError}</div>
          ) : null}
        </div>
      </Modal>
    </section>
  );
});
