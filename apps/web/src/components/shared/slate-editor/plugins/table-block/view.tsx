"use client";

import { Table2 } from "lucide-react";
import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertTableBlock, isTableBlockActive } from "./logic";

export function TableBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="表"
      icon={<Table2 className="h-4 w-4" />}
      active={isTableBlockActive(editor)}
      disabled={props.disabled}
      tooltip="表格"
      onMouseDown={(event) => {
        event.preventDefault();
        insertTableBlock(editor);
      }}
    />
  );
}
