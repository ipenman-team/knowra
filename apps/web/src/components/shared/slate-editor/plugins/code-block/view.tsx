"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertCodeBlock, isCodeBlockActive } from "./logic";

export function CodeBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="</>"
      active={isCodeBlockActive(editor)}
      disabled={props.disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        insertCodeBlock(editor);
      }}
    />
  );
}
