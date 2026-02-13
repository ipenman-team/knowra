'use client';

import { useState, type ChangeEvent, type RefObject } from 'react';
import Image from 'next/image';
import { Loader2, MoreHorizontal, Plus, Settings2, Upload } from 'lucide-react';
import type { PageDto } from '@/lib/api/pages/types';
import type {
  SiteBuilderConfig,
  SiteBuilderCustomMenu,
  SiteBuilderCustomMenuType,
} from '@/lib/api/site-builder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SlateEditor,
  parseContentToSlateValue,
} from '@/components/shared/slate-editor';
import { cn } from '@/lib/utils';
import { SiteBuilderPageListPreview } from './site-builder-page-list-preview';

type SiteBuilderConfigModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  logoInputRef: RefObject<HTMLInputElement | null>;
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenLogoPicker: () => void;
  config: SiteBuilderConfig;
  activeMenuId: string | null;
  activeMenu: SiteBuilderCustomMenu | null;
  activePage: PageDto | null;
  activePageListPages: PageDto[];
  activePageCoverMap: Record<string, string>;
  actionBusy: boolean;
  menuSettingsOpen: boolean;
  onMenuSettingsOpenChange: (open: boolean) => void;
  onSelectMenu: (menuId: string) => void;
  onAddMenu: () => void;
  canDeleteMenu: boolean;
  onDeleteMenu: () => void;
  onMenuLabelChange: (label: string) => void;
  onMenuTypeChange: (type: SiteBuilderCustomMenuType) => void;
  onReplacePage: () => void;
  onClearPage: () => void;
  onOpenPageListConfig: () => void;
  onReorderPageList: (nextPageIds: string[]) => void;
  onUpdatePageCover: (pageId: string, coverUrl: string | null) => void;
  onUploadPageCoverFile: (file: File) => Promise<string | null>;
};

export function SiteBuilderConfigModal({
  open,
  onOpenChange,
  loading,
  logoInputRef,
  onLogoFileChange,
  onOpenLogoPicker,
  config,
  activeMenuId,
  activeMenu,
  activePage,
  activePageListPages,
  activePageCoverMap,
  actionBusy,
  menuSettingsOpen,
  onMenuSettingsOpenChange,
  onSelectMenu,
  onAddMenu,
  canDeleteMenu,
  onDeleteMenu,
  onMenuLabelChange,
  onMenuTypeChange,
  onReplacePage,
  onClearPage,
  onOpenPageListConfig,
  onReorderPageList,
  onUpdatePageCover,
  onUploadPageCoverFile,
}: SiteBuilderConfigModalProps) {
  const activeSlateValue = parseContentToSlateValue(activePage?.content);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const handleMenuSettingsOpenChange = (open: boolean) => {
    onMenuSettingsOpenChange(open);
    if (!open) setDeleteConfirmOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden gap-0 rounded-none border-none p-0 sm:rounded-none">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
            <DialogTitle>配置界面</DialogTitle>
          </DialogHeader>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onLogoFileChange}
          />

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-6">
              <Card className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden border">
                <div className="border-b px-6 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={onOpenLogoPicker}
                      className="group/logo relative flex h-14 min-w-[180px] items-center justify-center rounded-md border border-dashed bg-background px-4 transition hover:border-primary/70"
                    >
                      {config.branding.logoUrl ? (
                        <Image
                          src={config.branding.logoUrl}
                          alt="Site logo"
                          width={160}
                          height={40}
                          unoptimized
                          className="h-10 w-auto max-w-[160px] object-contain"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4" />
                          上传 Logo
                        </span>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70 text-xs opacity-0 transition group-hover/logo:opacity-100">
                        点击上传并替换
                      </span>
                    </button>

                    <div className="flex items-center gap-2 overflow-x-auto">
                      {config.customMenus.map((menu) => (
                        <button
                          key={menu.id}
                          type="button"
                          onClick={() => {
                            onSelectMenu(menu.id);
                            setDeleteConfirmOpen(false);
                          }}
                          className={cn(
                            'shrink-0 border-b-2 px-3 py-1.5 text-sm transition',
                            activeMenuId === menu.id
                              ? 'border-foreground text-foreground'
                              : 'border-transparent text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {menu.label || '未命名菜单'}
                        </button>
                      ))}
                      <Popover
                        open={Boolean(activeMenu) && menuSettingsOpen}
                        onOpenChange={handleMenuSettingsOpenChange}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={!activeMenu}
                            aria-label="菜单设置"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[280px] space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="menu-config-name">菜单名称</Label>
                            <Input
                              id="menu-config-name"
                              value={activeMenu?.label ?? ''}
                              onChange={(event) =>
                                onMenuLabelChange(event.target.value)
                              }
                              placeholder="请输入菜单名称"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="menu-config-type">菜单类型</Label>
                            <Select
                              value={activeMenu?.type ?? 'SINGLE_PAGE'}
                              onValueChange={(value: SiteBuilderCustomMenuType) =>
                                onMenuTypeChange(value)
                              }
                            >
                              <SelectTrigger id="menu-config-type">
                                <SelectValue placeholder="选择菜单类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SINGLE_PAGE">单页面</SelectItem>
                                <SelectItem value="PAGE_LIST">多页面</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="pt-1">
                            <TooltipProvider delayDuration={0}>
                              <Tooltip
                                open={deleteConfirmOpen}
                                onOpenChange={setDeleteConfirmOpen}
                              >
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="w-full"
                                      disabled={actionBusy || !canDeleteMenu}
                                      onClick={() => setDeleteConfirmOpen(true)}
                                    >
                                      删除当前菜单
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  align="center"
                                  className="w-[240px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
                                >
                                  <p className="text-sm">确认删除当前菜单？</p>
                                  <div className="mt-2 flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeleteConfirmOpen(false)}
                                    >
                                      取消
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        onDeleteMenu();
                                        setDeleteConfirmOpen(false);
                                      }}
                                    >
                                      确认删除
                                    </Button>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {!canDeleteMenu ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                至少保留一个菜单
                              </p>
                            ) : null}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={onAddMenu}
                        disabled={actionBusy}
                        aria-label="新增菜单"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {activeMenu ? (
                    activeMenu.type === 'SINGLE_PAGE' ? (
                      activeMenu.pageId ? (
                        <div className="group relative rounded-md border bg-background p-4 transition-colors hover:border-primary/70">
                          <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onReplacePage}>
                                  重新选择页面
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onClearPage}>
                                  取消绑定
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {activePage ? (
                            <div className="space-y-3">
                              <div className="text-sm font-medium">
                                {activePage.title}
                              </div>
                              <SlateEditor
                                key={`${activePage.id}-${activePage.updatedAt}`}
                                value={activeSlateValue}
                                readOnly
                                showToolbar={false}
                                onChange={() => {}}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              正在加载页面内容...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed bg-background p-10 text-center">
                          <Button onClick={onReplacePage}>绑定/选择页面</Button>
                        </div>
                      )
                    ) : activeMenu.pageIds.length ? (
                      <div className="group relative rounded-md bg-background transition-colors hover:border-primary/70">
                        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onOpenPageListConfig}>
                                重新配置
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onClearPage}>
                                清空绑定
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <SiteBuilderPageListPreview
                          pages={activePageListPages}
                          style={activeMenu.style}
                          pageCoverMap={activePageCoverMap}
                          onReorder={onReorderPageList}
                          onUpdateCover={onUpdatePageCover}
                          onUploadCoverFile={onUploadPageCoverFile}
                        />
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed bg-background p-10 text-center">
                        <Button onClick={onOpenPageListConfig}>配置多页面</Button>
                      </div>
                    )
                  ) : (
                    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                      暂无菜单，请先点击右上角 + 新增菜单。
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
