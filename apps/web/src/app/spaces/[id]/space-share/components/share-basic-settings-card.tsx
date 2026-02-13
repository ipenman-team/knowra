'use client';

import { CopyIcon, ExternalLinkIcon, Loader2 } from 'lucide-react';
import type { ShareDto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type AccessMode = 'public' | 'password';
type ExpirePreset = 'never' | '7d' | '30d';

type ShareBasicSettingsCardProps = {
  loading: boolean;
  submitting: boolean;
  share: ShareDto | null;
  accessMode: AccessMode;
  expirePreset: ExpirePreset;
  passwordInput: string;
  shareUrl: string;
  onToggleShare: (checked: boolean) => void;
  onAccessModeChange: (mode: AccessMode) => void;
  onExpirePresetChange: (preset: ExpirePreset) => void;
  onPasswordInputChange: (value: string) => void;
  onCopyLink: () => void;
  onOpenLink: () => void;
};

export function ShareBasicSettingsCard({
  loading,
  submitting,
  share,
  accessMode,
  expirePreset,
  passwordInput,
  shareUrl,
  onToggleShare,
  onAccessModeChange,
  onExpirePresetChange,
  onPasswordInputChange,
  onCopyLink,
  onOpenLink,
}: ShareBasicSettingsCardProps) {
  return (
    <Card className="max-w-3xl border-none shadow-none">
      <CardHeader>
        <CardTitle>基础设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 pt-4">
            <Label>开启空间共享</Label>
            <p className="text-sm text-muted-foreground">
              {share
                ? '当前已开启，可复制链接发送给外部用户。'
                : '当前仅空间成员可见。'}
            </p>
          </div>
          <Switch
            checked={Boolean(share)}
            onCheckedChange={onToggleShare}
            disabled={loading || submitting}
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载共享配置...
          </div>
        ) : null}

        {share ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>访问方式</Label>
                <Select
                  value={accessMode}
                  onValueChange={(value: AccessMode) => onAccessModeChange(value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择访问方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">公开访问</SelectItem>
                    <SelectItem value="password">密码访问</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>有效期</Label>
                <Select
                  value={expirePreset}
                  onValueChange={(value: ExpirePreset) =>
                    onExpirePresetChange(value)
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择有效期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">永久有效</SelectItem>
                    <SelectItem value="7d">7 天有效</SelectItem>
                    <SelectItem value="30d">30 天有效</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accessMode === 'password' ? (
              <div className="space-y-2">
                <Label>访问密码</Label>
                <Input
                  type="text"
                  placeholder="请输入访问密码（更新设置时生效）"
                  value={passwordInput}
                  onChange={(event) => onPasswordInputChange(event.target.value)}
                  disabled={submitting}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>共享链接</Label>
              <div className="flex flex-wrap gap-2">
                <Input value={shareUrl} readOnly className="min-w-[240px] flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCopyLink}
                  aria-label="复制链接"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={onOpenLink}>
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  新窗口打开
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {share.expiresAt
                  ? `链接有效期至 ${new Date(share.expiresAt).toLocaleString()}`
                  : '链接永久有效，直到你手动关闭共享。'}
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
