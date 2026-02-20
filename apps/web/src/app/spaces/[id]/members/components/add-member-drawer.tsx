'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';

type AddMemberDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: SpaceRoleDto[];
  defaultRoleId: string;
  loading?: boolean;
  onSubmit: (params: { emailsRaw: string; roleId: string }) => Promise<boolean>;
};

export function AddMemberDrawer(props: AddMemberDrawerProps) {
  const { open, onOpenChange, roles, defaultRoleId, loading, onSubmit } = props;
  const [emailsRaw, setEmailsRaw] = useState('');
  const [roleId, setRoleId] = useState(defaultRoleId);

  useEffect(() => {
    if (!open) return;
    setEmailsRaw('');
    setRoleId(defaultRoleId);
  }, [defaultRoleId, open]);

  const canSubmit = Boolean(emailsRaw.trim()) && Boolean(roleId) && !loading;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="添加成员"
      description="支持输入多个邮箱，使用逗号、空格或换行分隔。"
      confirmText="发送邀请"
      confirmDisabled={!canSubmit}
      onConfirm={() => {
        void onSubmit({ emailsRaw, roleId }).then((ok) => {
          if (ok) onOpenChange(false);
        });
      }}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-emails">邮箱</Label>
          <Textarea
            id="invite-emails"
            placeholder="alice@example.com, bob@example.com"
            value={emailsRaw}
            onChange={(event) => setEmailsRaw(event.target.value)}
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>角色</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="选择角色" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
