'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpaceMemberDto, SpaceRoleDto } from '@/lib/api/spaces/types';
import { MemberRowActions } from './member-row-actions';

type MemberTableProps = {
  loading?: boolean;
  submitting?: boolean;
  members: SpaceMemberDto[];
  roles: SpaceRoleDto[];
  total: number;
  page: number;
  totalPages: number;
  queryInput: string;
  onQueryInputChange: (value: string) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onUpdateRole: (memberId: string, roleId: string) => void;
  onBatchUpdateRole: (memberIds: string[], roleId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onBatchRemove: (memberIds: string[]) => void;
};

export function MemberTable(props: MemberTableProps) {
  const {
    loading,
    submitting,
    members,
    roles,
    total,
    page,
    totalPages,
    queryInput,
    onQueryInputChange,
    onSearch,
    onPageChange,
    onUpdateRole,
    onBatchUpdateRole,
    onRemoveMember,
    onBatchRemove,
  } = props;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchRoleId, setBatchRoleId] = useState('');
  const memberIdSet = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => memberIdSet.has(id)),
    [memberIdSet, selectedIds],
  );

  const allSelected = useMemo(
    () => members.length > 0 && visibleSelectedIds.length === members.length,
    [members.length, visibleSelectedIds.length],
  );

  const selectedCount = visibleSelectedIds.length;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(members.map((member) => member.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return [...new Set([...prev, id])];
      return prev.filter((item) => item !== id);
    });
  };

  return (
    <div className="rounded-xl bg-card ring-1 ring-border/50">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={queryInput}
            onChange={(event) => onQueryInputChange(event.target.value)}
            className="pl-8"
            placeholder="搜索成员昵称或邮箱"
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch();
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={onSearch}
          disabled={loading || submitting}
        >
          搜索
        </Button>
        <div className="text-sm text-muted-foreground">共 {total} 人</div>
      </div>

      {selectedCount > 0 ? (
        <div className="mx-5 mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <div className="text-sm">已选中 {selectedCount} 项</div>
          <Select value={batchRoleId} onValueChange={setBatchRoleId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="批量设置角色" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={!batchRoleId || submitting}
            onClick={() => onBatchUpdateRole(visibleSelectedIds, batchRoleId)}
          >
            设置角色
          </Button>
          <Button
            variant="destructive"
            disabled={submitting}
            onClick={() => onBatchRemove(visibleSelectedIds)}
          >
            移除成员
          </Button>
          <Button variant="ghost" onClick={() => setSelectedIds([])}>
            取消选择
          </Button>
        </div>
      ) : null}

      <Table>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="h-11 border-y border-border/50 bg-muted/20 hover:bg-muted/20">
            <TableHead className="w-12 pl-5">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(value) => toggleAll(Boolean(value))}
              />
            </TableHead>
            <TableHead>成员</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead className="w-20 pr-5 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0">
          {members.map((member) => (
            <TableRow
              key={member.id}
              className="h-14 border-b border-border/40 hover:bg-muted/20"
            >
              <TableCell className="pl-5">
                <Checkbox
                  checked={visibleSelectedIds.includes(member.id)}
                  onCheckedChange={(value) =>
                    toggleOne(member.id, Boolean(value))
                  }
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {member.nickname || member.userId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.userId}
                </div>
              </TableCell>
              <TableCell>{member.roleName}</TableCell>
              <TableCell>{member.email || '-'}</TableCell>
              <TableCell className="pr-4 text-right">
                <MemberRowActions
                  member={member}
                  roles={roles}
                  disabled={submitting}
                  onRoleChange={(roleId) => onUpdateRole(member.id, roleId)}
                  onRemove={() => onRemoveMember(member.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {!loading && members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-20 text-center text-muted-foreground"
              >
                暂无成员数据
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end gap-2 border-t border-border/50 px-5 py-3">
        <Button
          variant="outline"
          disabled={page <= 1 || loading || submitting}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </Button>
        <div className="text-sm text-muted-foreground">
          第 {page} / {totalPages} 页
        </div>
        <Button
          variant="outline"
          disabled={page >= totalPages || loading || submitting}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
