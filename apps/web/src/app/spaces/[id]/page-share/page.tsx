'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShareList } from '@/components/share/page-share-list';
import { sharesApi, ShareDto } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import _ from 'lodash';

export default function PageSharePage() {
  const params = useParams();
  const spaceId = params.id as string;
  const [shares, setShares] = useState<(ShareDto & { name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const data = await sharesApi.list({ scopeType: 'SPACE', scopeId: spaceId });
      const references = data.references;
      const pagesMap = _.keyBy(references.pages, x => x.id);
      const sharesWithNames = data.items.map(x => ({
        ...x,
        name: pagesMap[x.targetId]?.title || '未知页面',
      }));
      setShares(sharesWithNames as any);
    } catch (error) {
      console.error(error);
      toast.error('获取共享列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [spaceId]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRevoke = async (share: ShareDto) => {
    try {
      await sharesApi.update(share.id, { status: 'REVOKED' });
      toast.success('已停止共享');
      fetchShares();
    } catch (error) {
      console.error(error);
      toast.error('操作失败');
    }
  };

  const handleCopyLink = (share: ShareDto) => {
    const url = `${window.location.origin}/share/p/${share.publicId}`;
    navigator.clipboard.writeText(url);
    toast.success('链接已复制');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
        <h1 className="text-lg font-semibold">页面共享</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Input placeholder="输入标题进行搜索" className="h-8" />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="bg-card rounded-lg border shadow-sm">
          <PageShareList
            shares={shares}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onRevoke={handleRevoke}
            onCopyLink={handleCopyLink}
          />
        </div>
      </div>
    </div>
  );
}
