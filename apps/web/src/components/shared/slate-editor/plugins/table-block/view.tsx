"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertTableBlock, isTableBlockActive } from "./logic";

export function TableBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="表"
      active={isTableBlockActive(editor)}
      disabled={props.disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        insertTableBlock(editor);
      }}
    />
  );
}
