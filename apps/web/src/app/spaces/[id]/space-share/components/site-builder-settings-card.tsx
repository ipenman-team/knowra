'use client';

import { CopyIcon, ExternalLinkIcon, Loader2 } from 'lucide-react';
import type { SiteBuilderConfig } from '@/lib/api/site-builder';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SiteBuilderSettingsCardProps = {
  loading: boolean;
  actionBusy: boolean;
  saving: boolean;
  publishing: boolean;
  autosaving: boolean;
  autosaveError: string | null;
  template: SiteBuilderConfig['template'];
  siteBuilderShareUrl: string;
  publishedAt: string | null;
  onTemplateChange: (template: SiteBuilderConfig['template']) => void;
  onOpenConfig: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onCopySiteBuilderLink: () => void;
  onOpenSiteBuilderLink: () => void;
};

export function SiteBuilderSettingsCard({
  loading,
  actionBusy,
  saving,
  publishing,
  autosaving,
  autosaveError,
  template,
  siteBuilderShareUrl,
  publishedAt,
  onTemplateChange,
  onOpenConfig,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onCopySiteBuilderLink,
  onOpenSiteBuilderLink,
}: SiteBuilderSettingsCardProps) {
  return (
    <Card className="max-w-3xl border-none shadow-none">
      <CardHeader>
        <CardTitle>高级设置</CardTitle>
        <CardDescription>自由配置展示站点</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载展示页配置...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>模版</Label>
              <Select
                value={template}
                onValueChange={(value: SiteBuilderConfig['template']) =>
                  onTemplateChange(value)
                }
                disabled={actionBusy}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="选择模版" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knowledge-site">Knowledge Site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={onOpenConfig}
                disabled={actionBusy}
              >
                打开配置界面
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onSaveDraft} disabled={actionBusy}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存草稿
              </Button>
              <Button onClick={onPublish} disabled={actionBusy}>
                {publishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                发布
              </Button>
              <Button variant="outline" onClick={onUnpublish} disabled={actionBusy}>
                下架
              </Button>
            </div>


            <div className="space-y-2">
              <Label>展示页链接</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={siteBuilderShareUrl}
                  readOnly
                  placeholder="发布后显示展示页链接"
                  className="min-w-[240px] flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCopySiteBuilderLink}
                  disabled={!siteBuilderShareUrl}
                  aria-label="复制展示页链接"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onOpenSiteBuilderLink}
                  disabled={!siteBuilderShareUrl}
                >
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  打开
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
