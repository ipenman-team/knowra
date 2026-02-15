"use client";

import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";

const TOOLBAR_TOOLTIP_BY_LABEL: Record<string, string> = {
  "↶": "撤销",
  "↷": "重做",
  "❝": "引用",
  "</>": "代码块",
  "•": "无序列表",
  "1.": "有序列表",
  IMG: "插入图片",
  图: "文本绘图",
  表: "表格",
};

export function ToolbarButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onMouseDown: (e: MouseEvent) => void;
}) {
  const tooltip =
    props.tooltip ?? TOOLBAR_TOOLTIP_BY_LABEL[props.label] ?? props.label;

  return (
    <Button
      type="button"
      variant={props.active ? "secondary" : "ghost"}
      className="h-8 px-2 text-xs"
      disabled={props.disabled}
      tooltip={tooltip}
      onMouseDown={props.onMouseDown}
    >
      {props.label}
    </Button>
  );
}
