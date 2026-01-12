import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageTopbar(props: {
  visible: boolean;
  pageMode: "edit" | "preview";
  activePageExists: boolean;
  pageTitle: string;
  publishedTitle?: string | null;
  pageLoading: boolean;
  pageSaving: boolean;
  pagePublishing: boolean;
  lastSavedAt: string | null;
  openMore: boolean;
  setOpenMore: (open: boolean | ((prev: boolean) => boolean)) => void;
  onCloseEdit: () => void;
  onEnterEdit: () => void;
  onPublish: () => void;
  onOpenImport: () => void;
  onOpenHistory: () => void;
}) {
  if (!props.visible) return null;

  const title = (props.pageMode === "preview" ? props.publishedTitle : props.pageTitle)?.trim() || "无标题文档";

  return (
    <div className="sticky top-0 z-20 border-b bg-background">
      <div className="flex h-12 items-center justify-between px-6 lg:px-11">
        <div className="flex min-w-0 items-center">
          <div className="truncate text-sm font-medium">{title}</div>
          {props.pageMode === "edit" ? (
            <div className="ml-3 shrink-0 text-xs text-muted-foreground">
              {props.pageLoading
                ? "加载中…"
                : props.pageSaving
                  ? "保存中…"
                  : props.lastSavedAt
                    ? `已保存 ${props.lastSavedAt}`
                    : ""}
            </div>
          ) : null}
        </div>

        {props.pageMode === "edit" ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={props.pagePublishing}
              aria-label="关闭"
              onClick={props.onCloseEdit}
            >
              ×
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={props.pageLoading || props.pageSaving || props.pagePublishing || !props.activePageExists}
              onClick={props.onPublish}
            >
              发布
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!props.activePageExists}
              onClick={props.onEnterEdit}
            >
              编辑
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 px-0 text-muted-foreground"
                aria-label="更多"
                aria-expanded={props.openMore}
                disabled={!props.activePageExists}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  props.setOpenMore((prev) => !prev);
                }}
              >
                …
              </Button>

              {props.openMore ? (
                <div
                  className={cn(
                    "absolute right-0 top-9 z-50 w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground",
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-full justify-start rounded-none px-2"
                    disabled={!props.activePageExists}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.setOpenMore(false);
                      props.onOpenImport();
                    }}
                  >
                    导入
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-full justify-start rounded-none px-2"
                    disabled={!props.activePageExists}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.setOpenMore(false);
                      props.onOpenHistory();
                    }}
                  >
                    历史版本
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
