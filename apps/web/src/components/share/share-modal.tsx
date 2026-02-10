'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { CopyIcon } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sharesApi, ShareDto } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRequiredSpaceId } from '@/hooks/use-required-space';

export const ShareModal = memo(function ShareModal({
  open,
  onOpenChange,
  targetId,
  type,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  type: 'PAGE';
  title: string;
}) {
  const spaceId = useRequiredSpaceId();
  const [share, setShare] = useState<ShareDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [uiMode, setUiMode] = useState<'public' | 'password'>('public');

  const fetchShare = useCallback(async () => {
    try {
      setLoading(true);
      const share = await sharesApi.getByTargetId(targetId);
      setShare(share || null);
      if (share) {
        setUiMode(share.hasPassword ? 'password' : 'public');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [targetId, type]);

  useEffect(() => {
    if (open) {
      fetchShare();
    }
  }, [open, fetchShare]);

  const handleCreateShare = async () => {
    try {
      setLoading(true);
      const newShare = await sharesApi.create({
        targetId,
        type,
        visibility: 'PUBLIC',
        scopeType: 'SPACE',
        scopeId: spaceId,
      });
      setShare(newShare);
      toast.success('已开启分享');
    } catch (err) {
      toast.error('开启分享失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShare = async (checked: boolean) => {
    if (checked) {
      if (!share) {
        handleCreateShare();
      } else {
        handleCreateShare();
      }
    } else {
      if (share) {
        try {
          setLoading(true);
          await sharesApi.update(share.id, { status: 'REVOKED' });
          setShare(null);
          toast.success('已关闭分享');
        } catch (err) {
          toast.error('关闭失败');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleAccessChange = async (value: string) => {
    if (!share) return;

    setUiMode(value as 'public' | 'password');

    if (value === 'public') {
      if (share.hasPassword) {
        // Remove password immediately if switching to public
        setLoading(true);
        try {
          const updated = await sharesApi.update(share.id, { password: null });
          setShare(updated);
          toast.success('已切换为公开访问');
        } catch {
          toast.error('切换失败');
          setUiMode('password'); // Revert on error
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Switching to password mode. 
      // If already has password, do nothing (just show UI).
      // If not, we wait for user to input password and click save.
    }
  };

  const handleSavePassword = async () => {
    if (!share) return;
    if (!passwordInput.trim()) {
      toast.error('密码不能为空');
      return;
    }

    try {
      setSavingPassword(true);
      const updated = await sharesApi.update(share.id, { password: passwordInput });
      setShare(updated);
      setPasswordInput('');
      toast.success('密码已设置');
    } catch (err) {
      toast.error('设置密码失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const shareUrl = share
    ? `${window.location.origin}/share/p/${share.publicId}`
    : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success('链接已复制');
  };

  return (
    <Modal
      className="w-[600px]"
      open={open}
      onOpenChange={onOpenChange}
      title="分享页面"
      footer={null}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>公开分享</Label>
            <div className="text-sm text-muted-foreground">
              {share ? '任何人都可以访问此页面' : '页面目前仅自己可见'}
            </div>
          </div>
          <Switch
            checked={!!share}
            onCheckedChange={handleToggleShare}
            disabled={loading}
          />
        </div>

        {share && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>访问权限</Label>
                <div className="text-xs text-muted-foreground">
                  {share.hasPassword ? '访问需要输入密码' : '任何拥有链接的人均可访问'}
                </div>
              </div>
              <Select
                value={uiMode}
                onValueChange={handleAccessChange}
                disabled={loading}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">公开访问</SelectItem>
                  <SelectItem value="password">密码保护</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uiMode === 'password' && (
              <div className="rounded-md border p-3 bg-muted/30 space-y-2">
                <div className="text-sm font-medium">
                  {share.hasPassword ? '修改密码' : '设置密码'}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={share.hasPassword ? '输入新密码' : '设置访问密码'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSavePassword}
                    disabled={savingPassword || !passwordInput.trim()}
                    size="sm"
                  >
                    {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">

              <Input value={shareUrl} readOnly />
              <Button size="icon" variant="outline" onClick={copyLink}>
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
});
