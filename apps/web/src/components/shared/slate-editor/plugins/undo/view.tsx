"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { runUndo } from "./logic";

export function UndoPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="↶"
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runUndo(editor);
      }}
    />
  );
}
