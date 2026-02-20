'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type CreateRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (params: { name: string; description: string }) => Promise<boolean>;
};

export function CreateRoleDialog(props: CreateRoleDialogProps) {
  const { open, onOpenChange, loading, onSubmit } = props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canSubmit = Boolean(name.trim()) && !loading;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setName('');
          setDescription('');
        }
      }}
      title="新建角色"
      confirmText="创建"
      confirmDisabled={!canSubmit}
      onConfirm={() => {
        void onSubmit({ name: name.trim(), description }).then((ok) => {
          if (ok) {
            onOpenChange(false);
            setName('');
            setDescription('');
          }
        });
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-role-name">角色名称</Label>
          <Input
            id="create-role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：只读访客"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-role-description">角色描述</Label>
          <Textarea
            id="create-role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="可选"
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
}
