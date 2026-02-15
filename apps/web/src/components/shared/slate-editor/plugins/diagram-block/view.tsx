"use client";

import { GitBranch } from "lucide-react";
import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertDiagramBlock, isDiagramBlockActive } from "./logic";

export function DiagramBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="图"
      icon={<GitBranch className="h-4 w-4" />}
      active={isDiagramBlockActive(editor)}
      disabled={props.disabled}
      tooltip="文本绘图"
      onMouseDown={(event) => {
        event.preventDefault();
        insertDiagramBlock(editor);
      }}
    />
  );
}
