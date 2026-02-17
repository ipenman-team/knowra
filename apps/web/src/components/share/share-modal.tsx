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
import { useI18n } from '@/lib/i18n/provider';

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
  const { t } = useI18n();
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
      } else {
        setUiMode('public');
      }
    } catch {
      // 非 404 情况由全局 api 拦截器提示
      setShare(null);
      setUiMode('public');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

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
      toast.success(t('shareModal.openSuccess'));
    } catch {
      toast.error(t('shareModal.openFailed'));
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
          toast.success(t('shareModal.closeSuccess'));
        } catch {
          toast.error(t('shareModal.closeFailed'));
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
            toast.success(t('shareModal.publicSwitchSuccess'));
          } catch {
            toast.error(t('shareModal.switchFailed'));
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
      toast.error(t('shareModal.passwordEmpty'));
      return;
    }

    try {
      setSavingPassword(true);
      const updated = await sharesApi.update(share.id, { password: passwordInput });
      setShare(updated);
      setPasswordInput('');
      toast.success(t('shareModal.passwordSaved'));
    } catch {
      toast.error(t('shareModal.passwordSaveFailed'));
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
    toast.success(t('shareModal.linkCopied'));
  };

  return (
    <Modal
      className="w-[calc(100vw-1rem)] max-w-[600px] max-h-[calc(100dvh-1rem)] overflow-hidden p-4 sm:p-6"
      open={open}
      onOpenChange={onOpenChange}
      title={
        title?.trim()
          ? `${t('shareModal.title')} · ${title}`
          : t('shareModal.title')
      }
      footer={null}
    >
      <div className="max-h-[calc(100dvh-11rem)] space-y-6 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t('shareModal.publicShare')}</Label>
            <div className="text-sm text-muted-foreground">
              {share
                ? t('shareModal.publicEnabledDesc')
                : t('shareModal.publicDisabledDesc')}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label>{t('shareModal.access')}</Label>
                <div className="text-xs text-muted-foreground">
                  {share.hasPassword
                    ? t('shareModal.accessPasswordDesc')
                    : t('shareModal.accessPublicDesc')}
                </div>
              </div>
              <Select
                value={uiMode}
                onValueChange={handleAccessChange}
                disabled={loading}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('shareModal.publicOption')}</SelectItem>
                  <SelectItem value="password">
                    {t('shareModal.passwordOption')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uiMode === 'password' && (
              <div className="rounded-md border p-3 bg-muted/30 space-y-2">
                <div className="text-sm font-medium">
                  {share.hasPassword
                    ? t('shareModal.changePassword')
                    : t('shareModal.setPassword')}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="text"
                    placeholder={
                      share.hasPassword
                        ? t('shareModal.newPasswordPlaceholder')
                        : t('shareModal.passwordPlaceholder')
                    }
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSavePassword}
                    disabled={savingPassword || !passwordInput.trim()}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('shareModal.save')}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <Input value={shareUrl} readOnly />
              <Button
                size="icon"
                variant="outline"
                onClick={copyLink}
                className="w-full sm:w-9"
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
});
