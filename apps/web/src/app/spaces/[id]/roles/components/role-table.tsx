'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpaceRoleDto } from '@/lib/api/spaces/types';

type RoleTableProps = {
  loading?: boolean;
  submitting?: boolean;
  roles: SpaceRoleDto[];
  onConfigurePermissions: (roleId: string) => void;
  onDeleteRole: (roleId: string) => void;
};

const ROLE_TYPE_LABEL: Record<string, string> = {
  OWNER: '所有者',
  ADMIN: '管理员',
  MEMBER: '成员',
};

export function RoleTable(props: RoleTableProps) {
  const { loading, submitting, roles, onConfigurePermissions, onDeleteRole } =
    props;

  return (
    <div className="rounded-xl bg-card ring-1 ring-border/50">
      <div className="px-5 py-4 text-sm text-muted-foreground">
        共 {roles.length} 个角色
      </div>

      <Table>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="h-11 border-y border-border/50 bg-muted/20 hover:bg-muted/20">
            <TableHead className="pl-5">角色名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>权限数</TableHead>
            <TableHead className="w-48 pr-5 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0">
          {roles.map((role) => {
            const roleType = role.builtInType
              ? (ROLE_TYPE_LABEL[role.builtInType] ?? role.builtInType)
              : '自定义';

            return (
              <TableRow
                key={role.id}
                className="h-14 border-b border-border/40 hover:bg-muted/20"
              >
                <TableCell className="pl-5 font-medium">
                  <div className="flex items-center gap-2">
                    {role.isBuiltIn ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                    <span>{role.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {role.description?.trim() || '-'}
                </TableCell>
                <TableCell>
                  {role.isBuiltIn ? `内置 · ${roleType}` : roleType}
                </TableCell>
                <TableCell>{role.permissions.length}</TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || submitting}
                      onClick={() => onConfigurePermissions(role.id)}
                    >
                      配置权限
                    </Button>
                    {!role.isBuiltIn ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={loading || submitting}
                        onClick={() => onDeleteRole(role.id)}
                      >
                        删除
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {!loading && roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-20 text-center text-muted-foreground"
              >
                暂无角色数据
              </TableCell>
            </TableRow>
          ) : null}
          {loading && roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-20 text-center text-muted-foreground"
              >
                加载中...
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
