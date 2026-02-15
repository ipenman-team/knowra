"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isUnderlineActive, runUnderline } from "./logic";

export function UnderlinePluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="U"
      tooltip="下划线"
      active={isUnderlineActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runUnderline(editor);
      }}
    />
  );
}
