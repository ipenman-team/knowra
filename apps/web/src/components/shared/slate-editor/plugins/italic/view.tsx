"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isItalicActive, runItalic } from "./logic";

export function ItalicPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="I"
      tooltip="斜体"
      active={isItalicActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runItalic(editor);
      }}
    />
  );
}
