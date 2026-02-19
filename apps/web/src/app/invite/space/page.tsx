'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authApi, spacesApi } from '@/lib/api';
import { useMeStore, useSpaceStore } from '@/stores';

type AcceptState =
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function AcceptSpaceInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [state, setState] = useState<AcceptState>({ status: 'pending' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: '邀请链接无效：缺少 token' });
      return;
    }

    let canceled = false;

    const run = async () => {
      try {
        const accepted = await spacesApi.acceptInvitation({ token });
        await authApi.switchTenant({ tenantId: accepted.tenantId });

        useMeStore.getState().invalidate();
        useSpaceStore.getState().invalidate();

        if (canceled) return;
        setState({ status: 'success' });
        router.replace(`/spaces/${encodeURIComponent(accepted.spaceId)}`);
      } catch (error) {
        if (canceled) return;
        const message =
          error instanceof Error && error.message
            ? error.message
            : '接受邀请失败，请重试';
        setState({ status: 'error', message });
      }
    };

    void run();

    return () => {
      canceled = true;
    };
  }, [router, token]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-6">
      <div className="w-full rounded-xl border bg-background p-6 text-center shadow-sm">
        {state.status === 'pending' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">正在接受邀请并切换空间...</p>
          </div>
        ) : null}

        {state.status === 'success' ? (
          <p className="text-sm text-muted-foreground">邀请已接受，正在跳转...</p>
        ) : null}

        {state.status === 'error' ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{state.message}</p>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm"
              onClick={() => router.replace('/workbench')}
            >
              返回工作台
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
