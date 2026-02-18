'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PublicSpaceViewer } from '@/components/share/public-space-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ShareDto } from '@/lib/api';
import { publicSharesApi } from '@/lib/api/public-shares';
import { toast } from 'sonner';
import { useMeStore } from '@/stores';

type ShareSnapshot = { payload?: unknown; createdAt?: string };

function extractErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (error as { response: { status?: unknown } }).response;
    if (typeof response.status === 'number') return response.status;
  }

  return undefined;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (error as { response: { data?: unknown } }).response;
    if (
      typeof response.data === 'object' &&
      response.data !== null &&
      'message' in response.data &&
      typeof (response.data as { message?: unknown }).message === 'string'
    ) {
      return (response.data as { message: string }).message;
    }
  }

  return '';
}

export default function PublicSpaceSharePage() {
  const params = useParams();
  const publicId = params.publicId as string;
  const user = useMeStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<ShareDto | null>(null);
  const [snapshot, setSnapshot] = useState<ShareSnapshot | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchShare = useCallback(
    async (pwd?: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await publicSharesApi.getPublicAccess(publicId, pwd);
        if (res.share.type !== 'SPACE') {
          setError('该共享链接不是空间共享链接。');
          return;
        }
        if (!res.snapshot?.payload) {
          setError('该空间尚未生成可访问内容，请联系分享者刷新共享。');
          return;
        }

        setShare(res.share);
        setSnapshot(res.snapshot ?? null);
        setPasswordRequired(false);
      } catch (error: unknown) {
        const status = extractErrorStatus(error);
        const msg = extractErrorMessage(error);

        if (status === 401 || msg.includes('password')) {
          setPasswordRequired(true);
          if (pwd) {
            toast.error('密码错误');
          }
        } else {
          setError('无法访问此空间，可能已被删除或取消分享。');
        }
      } finally {
        setLoading(false);
      }
    },
    [publicId],
  );

  useEffect(() => {
    if (!publicId) return;
    fetchShare();
  }, [fetchShare, publicId]);

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchShare(password);
  };

  if (loading && !passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">访问失败</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Card className="mx-4 w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>需要密码</CardTitle>
            <CardDescription>此空间受密码保护，请输入密码继续访问。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  '访问空间'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (share && snapshot) {
    return (
      <PublicSpaceViewer
        share={share}
        snapshot={snapshot}
        publicId={publicId}
        password={password || undefined}
        canWrite={Boolean(user?.id)}
      />
    );
  }

  return null;
}
