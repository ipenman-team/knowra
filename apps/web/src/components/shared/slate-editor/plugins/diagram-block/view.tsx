"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertDiagramBlock, isDiagramBlockActive } from "./logic";

export function DiagramBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="图"
      active={isDiagramBlockActive(editor)}
      disabled={props.disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        insertDiagramBlock(editor);
      }}
    />
  );
}
