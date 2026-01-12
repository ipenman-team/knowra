import { Tree, type TreeNode } from "@/components/common/tree";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function PageTree<T>(props: {
  nodes: TreeNode<T>[];
  selectedId?: string;
  pagesLoaded: boolean;
  creatingPage: boolean;
  renamingTargetId: string | null;
  renamingValue: string;
  savingRename: boolean;
  openMenuNodeId: string | null;
  onCreatePage: () => void;
  onCreateChildPage: (node: TreeNode<T>) => void;
  onSelectPage: (id: string, title: string) => void;
  onToggleNodeMenu: (id: string | null) => void;
  onRenameStart: (id: string, title: string) => void;
  onRenameValueChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDeleteRequest: (id: string, title: string) => void;
}) {
  const empty = props.pagesLoaded && props.nodes.length === 0;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-8 w-full justify-start px-2 text-xs font-medium tracking-wide text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
      >
        页面
      </Button>

      {empty ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start px-2"
          disabled={props.creatingPage}
          onClick={props.onCreatePage}
        >
          新建
        </Button>
      ) : (
        <Tree
          nodes={props.nodes}
          selectedId={props.selectedId}
          renderNode={({
            node,
            depth,
            selected: isSelected,
            hasChildren,
            expanded,
            toggleExpanded,
          }) => {
            const isRenaming = props.renamingTargetId === node.id;

            return (
              <div className="group flex items-center" style={{ paddingLeft: 8 + depth * 14 }}>
                {hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mr-1 h-7 w-7 px-0 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded();
                    }}
                    aria-label={expanded ? "收起" : "展开"}
                    aria-expanded={expanded}
                  >
                    {expanded ? "▾" : "▸"}
                  </Button>
                ) : (
                  <span className="mr-1 h-7 w-7" aria-hidden="true" />
                )}

                {isRenaming ? (
                  <input
                    className={cn(
                      "h-9 w-full flex-1 rounded-md border bg-background px-2 text-sm",
                      "border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    )}
                    value={props.renamingValue}
                    autoFocus
                    disabled={props.savingRename}
                    onChange={(e) => props.onRenameValueChange(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onRenameCommit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onRenameCancel();
                      }
                    }}
                    onBlur={props.onRenameCancel}
                  />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-9 w-full flex-1 justify-start px-2",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => props.onSelectPage(node.id, node.label)}
                  >
                    <span className="truncate">{node.label}</span>
                  </Button>
                )}

                {!isRenaming ? (
                  <div
                    className={cn(
                      "ml-1 flex items-center gap-0.5",
                      "opacity-0 transition-opacity group-hover:opacity-100",
                    )}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 px-0 text-muted-foreground"
                      aria-label="新建子页面"
                      disabled={props.creatingPage}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onCreateChildPage(node);
                      }}
                    >
                      +
                    </Button>

                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 px-0 text-muted-foreground"
                        aria-label="更多"
                        aria-expanded={props.openMenuNodeId === node.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          props.onToggleNodeMenu(props.openMenuNodeId === node.id ? null : node.id);
                        }}
                      >
                        …
                      </Button>

                      {props.openMenuNodeId === node.id ? (
                        <div
                          className={cn(
                            "absolute right-0 top-8 z-50 w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground",
                          )}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-full justify-start rounded-none px-2"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              props.onToggleNodeMenu(null);
                              props.onSelectPage(node.id, node.label);
                              props.onRenameStart(node.id, node.label);
                            }}
                          >
                            重命名
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-full justify-start rounded-none px-2 text-destructive"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              props.onToggleNodeMenu(null);
                              props.onDeleteRequest(node.id, node.label);
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      )}

      <Separator />
    </>
  );
}
