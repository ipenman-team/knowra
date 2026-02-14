"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isBoldActive, runBold } from "./logic";

export function BoldPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="B"
      active={isBoldActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runBold(editor);
      }}
    />
  );
}
