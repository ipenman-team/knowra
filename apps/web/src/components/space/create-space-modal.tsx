"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { spacesApi } from '@/lib/api';
import { useMeStore } from '@/stores';
import type { SpaceDto } from '@/lib/api/spaces/types';
import { toast } from 'sonner';

export function CreateSpaceModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (space: SpaceDto) => void;
}) {
  const { open, onOpenChange, onCreated } = props;
  const tenant = useMeStore((s) => s.tenant);
  const isPersonalTenant = tenant?.type === 'PERSONAL';

  useEffect(() => {
    if (open) {
      console.log('tenant', tenant);
    }
  }, [open, tenant]);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', identifier: '', type: 'ORG', description: '' });

  const handleCreate = async () => {
    if (!form.name?.trim()) return;
    setCreating(true);
    try {
      const created = await spacesApi.create({
        name: form.name,
        identifier: form.identifier || undefined,
        type: isPersonalTenant ? 'PERSONAL' : form.type,
        description: form.description || undefined,
      });
      toast.success('创建成功');
      onCreated?.(created as SpaceDto);
      onOpenChange(false);
      setForm({ name: '', identifier: '', type: 'ORG', description: '' });
    } catch (e) {
      // ignore for now
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      title="创建空间"
      onOpenChange={onOpenChange}
      onConfirm={handleCreate}
      confirmDisabled={creating || !form.name.trim()}
      confirmText="创建"
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium">空间名称</div>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入空间名称" />
        </div>

        <div>
          <div className="text-sm font-medium">空间标识</div>
          <Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="大写字母或数字，最长15" />
        </div>

        <div>
          <div className="text-sm font-medium">可见范围</div>
          {isPersonalTenant ? (
            <select className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value="PERSONAL" disabled>
              <option value="PERSONAL">个人</option>
            </select>
          ) : (
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="PERSONAL">个人</option>
              <option value="ORG">组织</option>
            </select>
          )}
        </div>

        <div>
          <div className="text-sm font-medium">描述</div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="输入空间描述" className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" rows={4} />
        </div>
      </div>
    </Modal>
  );
}

export default CreateSpaceModal;
