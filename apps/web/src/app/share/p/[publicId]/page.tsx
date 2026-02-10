'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { sharesApi, ShareDto } from '@/lib/api';
import { PublicPageViewer } from '@/components/share/public-page-viewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function PublicSharePage() {
  const params = useParams();
  const publicId = params.publicId as string;
  
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<ShareDto | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchShare = useCallback(async (pwd?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await sharesApi.getPublicAccess(publicId, pwd);
      setShare(res.share);
      setSnapshot(res.snapshot);
      setPasswordRequired(false);
    } catch (err: any) {
      // Check if error is "password required"
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || '';
      
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
    return <PublicPageViewer share={share} snapshot={snapshot} />;
  }

  return null;
}
