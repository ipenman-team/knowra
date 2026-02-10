'use client';

import { ShareDto } from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MoreVertical, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface PageShareListProps {
  shares: ShareDto[];
  onToggleSelect: (id: string) => void;
  selectedIds: string[];
  onRevoke?: (share: ShareDto) => void;
  onCopyLink?: (share: ShareDto) => void;
}

export function PageShareList({ shares, onToggleSelect, selectedIds, onRevoke, onCopyLink }: PageShareListProps) {
  const allSelected = shares.length > 0 && selectedIds.length === shares.length;

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={() => {
                    // Logic to toggle all would go here
                  }}
                />
                <span>名称</span>
              </div>
            </TableHead>
            <TableHead>作者</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">更新时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shares.map((share) => (
            <TableRow key={share.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.includes(share.id)}
                    onCheckedChange={() => onToggleSelect(share.id)}
                  />
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate font-medium max-w-[200px]">{}</span>
                    {share.hasPassword && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {share.visibility === 'PUBLIC' && <Globe className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="text-xs">{share.createdBy}</span>
              </TableCell>
              <TableCell>
                <Badge variant={share.status === 'ACTIVE' ? 'secondary' : 'outline'} className={share.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'text-muted-foreground'}>
                  {share.status === 'ACTIVE' ? '共享中' : '已失效'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-muted-foreground text-sm">
                    {format(new Date(share.updatedAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onCopyLink?.(share)}>复制链接</DropdownMenuItem>
                      <DropdownMenuItem>设置</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onRevoke?.(share)}>停止共享</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {shares.length === 0 && (
             <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    暂无共享页面
                </TableCell>
             </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
