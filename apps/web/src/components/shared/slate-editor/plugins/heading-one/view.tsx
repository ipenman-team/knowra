"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isHeadingOneActive, runHeadingOne } from "./logic";

export function HeadingOnePluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="H1"
      active={isHeadingOneActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runHeadingOne(editor);
      }}
    />
  );
}
