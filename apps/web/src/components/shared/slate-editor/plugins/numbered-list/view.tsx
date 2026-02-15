"use client";

import { useSlate } from "slate-react";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { isNumberedListActive, runNumberedList } from "./logic";
import { ListOrderedIcon } from "lucide-react";

export function NumberedListPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="1."
      icon={<ListOrderedIcon />}
      tooltip="有序列表"
      active={isNumberedListActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runNumberedList(editor);
      }}
    />
  );
}
