"use client";

import { memo, useState } from "react";
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
import type { MeProfile } from "@/stores";

export const SettingsModalMain = memo(function SettingsModalMain({
  profile,
}: {
  profile: MeProfile | null | undefined;
}) {
  const phone = profile?.phone?.trim() || "";
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleOpenReset = () => {
    setResetOpen(true);
    setEmail("");
    setCode("");
    setNextPassword("");
    setConfirmPassword("");
  };

  return (
    <section className="flex-1 px-8 py-6">
      <div className="flex flex-col gap-6">
        <Item variant="muted">
          <ItemMedia variant="icon">
            <CheckCircle2 className="text-emerald-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>手机号</ItemTitle>
            <ItemDescription>
              {phone ? phone : "未绑定手机号"}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" disabled>
              {phone ? "更改" : "绑定"}
            </Button>
          </ItemActions>
        </Item>

        <Item variant="muted">
          <ItemMedia variant="icon">
            <AlertCircle className="text-amber-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>邮箱</ItemTitle>
            <ItemDescription>暂未绑定</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" disabled>
              绑定
            </Button>
          </ItemActions>
        </Item>

        <Item variant="muted">
          <ItemMedia variant="icon">
            <CheckCircle2 className="text-emerald-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>账户密码</ItemTitle>
            <ItemDescription>用于登录与安全验证</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" onClick={handleOpenReset}>
              重置密码
            </Button>
          </ItemActions>
        </Item>
      </div>

      <Modal
        open={resetOpen}
        title="邮箱重置密码"
        onOpenChange={setResetOpen}
        confirmText="提交"
        onConfirm={() => {
          // TODO: connect reset password API
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
              <Button variant="outline" size="sm">
                获取验证码
              </Button>
            </div>
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
        </div>
      </Modal>
    </section>
  );
});
