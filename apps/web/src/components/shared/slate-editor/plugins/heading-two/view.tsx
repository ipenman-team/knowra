"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isHeadingTwoActive, runHeadingTwo } from "./logic";

export function HeadingTwoPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="H2"
      active={isHeadingTwoActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runHeadingTwo(editor);
      }}
    />
  );
}
