import { X } from 'lucide-react';

import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { EmailInviteDraft, InviteRole } from './types';

type StepInviteFormProps = {
  inviteInputId: string;
  inviteInput: string;
  inviteRole: InviteRole;
  emailInvites: EmailInviteDraft[];
  createLinkInvite: boolean;
  linkInviteRole: InviteRole;
  onInviteInputChange: (value: string) => void;
  onInviteRoleChange: (value: InviteRole) => void;
  onAddEmails: () => void;
  onRemoveInvite: (email: string) => void;
  onCreateLinkInviteChange: (checked: boolean) => void;
  onLinkInviteRoleChange: (value: InviteRole) => void;
};

export function StepInviteForm(props: StepInviteFormProps) {
  const {
    inviteInputId,
    inviteInput,
    inviteRole,
    emailInvites,
    createLinkInvite,
    linkInviteRole,
    onInviteInputChange,
    onInviteRoleChange,
    onAddEmails,
    onRemoveInvite,
    onCreateLinkInviteChange,
    onLinkInviteRoleChange,
  } = props;

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor={inviteInputId}>邮箱邀请</FieldLabel>
        <FieldContent>
          <Textarea
            id={inviteInputId}
            rows={4}
            value={inviteInput}
            onChange={(event) => onInviteInputChange(event.target.value)}
            placeholder="输入邮箱，支持逗号或换行分隔"
          />
        </FieldContent>
      </Field>

      <div className="flex items-center gap-3">
        <Select
          value={inviteRole}
          onValueChange={(value) => onInviteRoleChange(value as InviteRole)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="选择角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">成员</SelectItem>
            <SelectItem value="ADMIN">管理员</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={onAddEmails}>
          添加到邀请列表
        </Button>
      </div>

      {emailInvites.length > 0 ? (
        <div className="space-y-2 rounded-md border p-3">
          {emailInvites.map((item) => (
            <div
              key={item.email}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">{item.email}</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{item.role === 'ADMIN' ? '管理员' : '成员'}</span>
                <button
                  type="button"
                  aria-label="移除"
                  className="rounded p-1 hover:bg-muted"
                  onClick={() => onRemoveInvite(item.email)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">创建邀请链接</p>
            <p className="text-xs text-muted-foreground">
              创建空间后自动生成一条邀请链接
            </p>
          </div>
          <input
            type="checkbox"
            checked={createLinkInvite}
            onChange={(event) => onCreateLinkInviteChange(event.target.checked)}
          />
        </div>
        {createLinkInvite ? (
          <div className="mt-3">
            <Select
              value={linkInviteRole}
              onValueChange={(value) => onLinkInviteRoleChange(value as InviteRole)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="链接角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">成员</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </FieldGroup>
  );
}
