"use client";

import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";

export function ToolbarButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onMouseDown: (e: MouseEvent) => void;
}) {
  return (
    <Button
      type="button"
      variant={props.active ? "secondary" : "ghost"}
      className="h-8 px-2 text-xs"
      disabled={props.disabled}
      onMouseDown={props.onMouseDown}
    >
      {props.label}
    </Button>
  );
}
