"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isBlockQuoteActive, runBlockQuote } from "./logic";

export function BlockQuotePluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="❝"
      active={isBlockQuoteActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runBlockQuote(editor);
      }}
    />
  );
}
