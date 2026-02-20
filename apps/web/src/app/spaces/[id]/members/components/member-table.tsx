'use client';

import { Search } from 'lucide-react';
import { type MouseEvent, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { cn } from '@/lib/utils';
import type { SpaceMemberDto, SpaceRoleDto } from '@/lib/api/spaces/types';
import { MemberRowActions } from './member-row-actions';

type PaginationToken = number | 'ellipsis-start' | 'ellipsis-end';

function buildPaginationTokens(
  currentPage: number,
  totalPages: number,
): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PaginationToken[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) {
    tokens.push('ellipsis-start');
  }

  for (let page = left; page <= right; page += 1) {
    tokens.push(page);
  }

  if (right < totalPages - 1) {
    tokens.push('ellipsis-end');
  }

  tokens.push(totalPages);
  return tokens;
}

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
  onPageChange: (page: number) => void;
  onUpdateRole: (memberId: string, roleId: string) => void;
  onBatchUpdateRole: (memberIds: string[], roleId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onBatchRemove: (memberIds: string[]) => void;
  onAddMember?: () => void;
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
    onPageChange,
    onUpdateRole,
    onBatchUpdateRole,
    onRemoveMember,
    onBatchRemove,
    onAddMember,
  } = props;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchRoleId, setBatchRoleId] = useState('');
  const memberIdSet = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );
  const ownerMemberIdSet = useMemo(
    () =>
      new Set(
        members
          .filter(
            (member) =>
              member.roleBuiltInType === 'OWNER' || member.role === 'OWNER',
          )
          .map((member) => member.id),
      ),
    [members],
  );
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => memberIdSet.has(id)),
    [memberIdSet, selectedIds],
  );
  const removableSelectedIds = useMemo(
    () => visibleSelectedIds.filter((id) => !ownerMemberIdSet.has(id)),
    [ownerMemberIdSet, visibleSelectedIds],
  );
  const updatableRoleSelectedIds = useMemo(
    () => visibleSelectedIds.filter((id) => !ownerMemberIdSet.has(id)),
    [ownerMemberIdSet, visibleSelectedIds],
  );

  const allSelected = useMemo(
    () => members.length > 0 && visibleSelectedIds.length === members.length,
    [members.length, visibleSelectedIds.length],
  );

  const selectedCount = visibleSelectedIds.length;
  const selectedOwnerCount = selectedCount - removableSelectedIds.length;
  const paginationTokens = useMemo(
    () => buildPaginationTokens(page, totalPages),
    [page, totalPages],
  );

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

  const handlePageClick =
    (nextPage: number) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      if (
        nextPage < 1 ||
        nextPage > totalPages ||
        nextPage === page ||
        loading ||
        submitting
      ) {
        return;
      }

      onPageChange(nextPage);
    };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="w-64 shrink-0">
          <InputGroup className="border-0 bg-transparent shadow-none">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={queryInput}
              onChange={(event) => onQueryInputChange(event.target.value)}
              placeholder="搜索成员昵称或邮箱"
              className="pl-2 pr-0"
            />
          </InputGroup>
        </div>

        {onAddMember ? (
          <Button onClick={onAddMember} disabled={loading || submitting}>
            添加成员
          </Button>
        ) : null}
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 px-4 py-3">
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
            disabled={
              !batchRoleId || submitting || updatableRoleSelectedIds.length === 0
            }
            tooltip={
              selectedOwnerCount > 0
                ? '所有者成员角色不可修改，将忽略该成员'
                : undefined
            }
            onClick={() =>
              onBatchUpdateRole(updatableRoleSelectedIds, batchRoleId)
            }
          >
            设置角色
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={submitting || removableSelectedIds.length === 0}
                tooltip={
                  selectedOwnerCount > 0
                    ? '所有者成员不可删除，将忽略该成员'
                    : undefined
                }
              >
                移除成员
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>批量删除成员</AlertDialogTitle>
                <AlertDialogDescription>
                  确认删除选中的 {removableSelectedIds.length}{' '}
                  位成员吗？删除后，这些成员将失去此空间访问权限。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onBatchRemove(removableSelectedIds)}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" onClick={() => setSelectedIds([])}>
            取消选择
          </Button>
        </div>
      ) : null}

      <Table className="[&_tr]:border-0">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="h-11 bg-transparent hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(value) => toggleAll(Boolean(value))}
              />
            </TableHead>
            <TableHead>名称</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead className="w-28 text-left">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="h-14 hover:bg-muted/20">
              <TableCell>
                <Checkbox
                  checked={visibleSelectedIds.includes(member.id)}
                  onCheckedChange={(value) =>
                    toggleOne(member.id, Boolean(value))
                  }
                />
              </TableCell>
              <TableCell className="font-medium">
                {member.nickname || member.email || member.userId}
              </TableCell>
              <TableCell>{member.roleName}</TableCell>
              <TableCell>{member.email || '-'}</TableCell>
              <TableCell>
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

      <div className="flex items-center justify-end gap-4">
        <div className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          共 {total} 人
        </div>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={handlePageClick(page - 1)}
                className={cn(
                  (page <= 1 || loading || submitting) &&
                    'pointer-events-none opacity-50',
                )}
              />
            </PaginationItem>

            {paginationTokens.map((token) => (
              <PaginationItem key={token}>
                {typeof token === 'number' ? (
                  <PaginationLink
                    href="#"
                    isActive={token === page}
                    onClick={handlePageClick(token)}
                    className={cn(
                      (loading || submitting) && 'pointer-events-none',
                    )}
                  >
                    {token}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={handlePageClick(page + 1)}
                className={cn(
                  (page >= totalPages || loading || submitting) &&
                    'pointer-events-none opacity-50',
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
