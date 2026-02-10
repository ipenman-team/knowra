'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShareList } from '@/components/share/page-share-list';
import { ShareDto } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PageSharePage() {
  const params = useParams();
  const spaceId = params.id as string;
  const [shares, setShares] = useState<ShareDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchShares() {
      try {
        setLoading(true);
        // Mock data for layout visualization
        setShares([
            {
                id: '1',
                tenantId: 'mock-tenant',
                type: 'PAGE',
                targetId: 'page-1',
                status: 'ACTIVE',
                visibility: 'PUBLIC',
                publicId: 'mock-public-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                hasPassword: true
            },
            {
                id: '2',
                tenantId: 'mock-tenant',
                type: 'PAGE',
                targetId: 'page-2',
                status: 'REVOKED',
                visibility: 'PUBLIC',
                publicId: 'mock-public-2',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                hasPassword: false
            }
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchShares();
  }, [spaceId]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
               />
            </div>
        </div>
    </div>
  );
}
