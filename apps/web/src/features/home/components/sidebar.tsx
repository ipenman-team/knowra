import type { TreeNode } from "@/components/common/tree";
import { Separator } from "@/components/ui/separator";

import { PageTree } from "./page-tree";
import { SidebarItem } from "./sidebar-item";
import type { Selected, ViewId } from "../types";

export function Sidebar<T>(props: {
  selected: Selected;
  onSelectView: (id: ViewId) => void;
  onSelectPage: (id: string, title: string) => void;
  nodes: TreeNode<T>[];
  pagesLoaded: boolean;
  creatingPage: boolean;
  renamingTargetId: string | null;
  renamingValue: string;
  savingRename: boolean;
  openMenuNodeId: string | null;
  onCreatePage: () => void;
  onCreateChildPage: (node: TreeNode<T>) => void;
  onToggleNodeMenu: (id: string | null) => void;
  onRenameStart: (id: string, title: string) => void;
  onRenameValueChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDeleteRequest: (id: string, title: string) => void;
}) {
  return (
    <aside className="w-72 border-r bg-muted/30">
      <div className="flex h-dvh flex-col gap-4 overflow-auto p-3">
        <SidebarItem
          label="仪表盘"
          active={props.selected.kind === "view" && props.selected.id === "dashboard"}
          onClick={() => props.onSelectView("dashboard")}
        />

        <SidebarItem
          label="Notion AI"
          active={props.selected.kind === "view" && props.selected.id === "notion-ai"}
          onClick={() => props.onSelectView("notion-ai")}
        />

        <Separator />

        <PageTree
          nodes={props.nodes}
          selectedId={props.selected.kind === "page" ? props.selected.id : undefined}
          pagesLoaded={props.pagesLoaded}
          creatingPage={props.creatingPage}
          renamingTargetId={props.renamingTargetId}
          renamingValue={props.renamingValue}
          savingRename={props.savingRename}
          openMenuNodeId={props.openMenuNodeId}
          onCreatePage={props.onCreatePage}
          onCreateChildPage={props.onCreateChildPage}
          onSelectPage={props.onSelectPage}
          onToggleNodeMenu={props.onToggleNodeMenu}
          onRenameStart={props.onRenameStart}
          onRenameValueChange={props.onRenameValueChange}
          onRenameCommit={props.onRenameCommit}
          onRenameCancel={props.onRenameCancel}
          onDeleteRequest={props.onDeleteRequest}
        />

        <SidebarItem
          label="设置"
          active={props.selected.kind === "view" && props.selected.id === "settings"}
          onClick={() => props.onSelectView("settings")}
        />
      </div>
    </aside>
  );
}
