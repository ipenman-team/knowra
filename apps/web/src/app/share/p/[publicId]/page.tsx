'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { ShareDto } from '@/lib/api';
import { publicSharesApi } from '@/lib/api/public-shares';
import { PublicPageViewer } from '@/components/share/public-page-viewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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

export default function PublicSharePage() {
  const params = useParams();
  const publicId = params.publicId as string;
  const user = useMeStore((s) => s.user);
  
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<ShareDto | null>(null);
  const [snapshot, setSnapshot] = useState<ShareSnapshot | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchShare = useCallback(async (pwd?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicSharesApi.getPublicAccess(publicId, pwd);
      setShare(res.share);
      setSnapshot(res.snapshot ?? null);
      setPasswordRequired(false);
    } catch (error: unknown) {
      const status = extractErrorStatus(error);
      const msg = extractErrorMessage(error);
      
      // 401 Unauthorized is returned for password required/invalid
      if (status === 401 || msg.includes('password')) {
         setPasswordRequired(true);
         if (pwd) {
             toast.error('密码错误');
         }
      } else {
         setError('无法访问此页面，可能已被删除或取消分享。');
      }
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    if (publicId) {
      fetchShare();
    }
  }, [publicId, fetchShare]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
       <div className="flex h-screen items-center justify-center flex-col gap-4">
         <h1 className="text-xl font-semibold">访问失败</h1>
         <p className="text-muted-foreground">{error}</p>
       </div>
     );
  }

  if (passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardHeader>
            <CardTitle>需要密码</CardTitle>
            <CardDescription>此页面受密码保护，请输入密码继续访问。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input 
                type="password" 
                placeholder="输入密码" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '访问'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (share && snapshot) {
    return (
      <PublicPageViewer
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
