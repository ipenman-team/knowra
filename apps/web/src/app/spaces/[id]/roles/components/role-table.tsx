'use client';

import { Lock, Settings2, Trash2 } from 'lucide-react';
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
  onCreateRole: () => void;
  onConfigurePermissions: (roleId: string) => void;
  onDeleteRole: (roleId: string) => void;
};

const BUILT_IN_ROLE_DESCRIPTION: Record<string, string> = {
  OWNER: '空间所有者，拥有全部管理权限。',
  ADMIN: '空间管理员，可管理成员、角色与协作设置。',
  MEMBER: '空间成员，可进行日常内容协作。',
};

export function RoleTable(props: RoleTableProps) {
  const {
    loading,
    submitting,
    roles,
    onCreateRole,
    onConfigurePermissions,
    onDeleteRole,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          共 {roles.length} 个角色
        </div>
        <Button
          className="ml-auto"
          onClick={onCreateRole}
          disabled={loading || submitting}
        >
          新建角色
        </Button>
      </div>

      <Table className="[&_tr]:border-0">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="h-11 bg-transparent hover:bg-transparent">
            <TableHead>角色名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>角色类型</TableHead>
            <TableHead className="w-32 text-left">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const roleType = role.isBuiltIn ? '系统' : '自定义';
            const displayDescription = role.isBuiltIn
              ? (BUILT_IN_ROLE_DESCRIPTION[role.builtInType ?? ''] ??
                '系统内置角色')
              : role.description?.trim() || '-';

            return (
              <TableRow key={role.id} className="h-14 hover:bg-muted/20">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {role.isBuiltIn ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                    <span>{role.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {displayDescription}
                </TableCell>
                <TableCell>{roleType}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      tooltip="配置权限"
                      aria-label="配置权限"
                      disabled={loading || submitting}
                      onClick={() => onConfigurePermissions(role.id)}
                    >
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {!role.isBuiltIn ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            tooltip="删除角色"
                            aria-label="删除角色"
                            disabled={loading || submitting}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除角色</AlertDialogTitle>
                            <AlertDialogDescription>
                              确认删除角色“{role.name}
                              ”吗？该角色下成员将失去该角色权限。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteRole(role.id)}
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {!loading && roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-20 text-center text-muted-foreground"
              >
                暂无角色数据
              </TableCell>
            </TableRow>
          ) : null}
          {loading && roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
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
