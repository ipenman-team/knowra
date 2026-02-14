"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { runRedo } from "./logic";

export function RedoPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="↷"
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runRedo(editor);
      }}
    />
  );
}
