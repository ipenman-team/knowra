"use client";

import { useCallback, useRef } from "react";
import { Type } from "lucide-react";
import { Range, Transforms } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { ColorPicker } from "@/components/ui/color-picker";

import type { ToolbarPluginProps } from "../types";
import { getTextColor, runTextColor } from "./logic";

export function TextColorPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);

  const cacheSelection = useCallback(() => {
    selectionRef.current = editor.selection;
  }, [editor]);

  const restoreSelection = useCallback(() => {
    if (!selectionRef.current) return;

    try {
      Transforms.select(editor, selectionRef.current);
    } catch {
      // ignore invalid paths when document changed
    }
  }, [editor]);

  const onChangeColor = useCallback(
    (color: string | null) => {
      if (props.disabled) return;

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      runTextColor(editor, color);
    },
    [editor, props.disabled, restoreSelection],
  );

  return (
    <ColorPicker
      label="文字颜色"
      defaultLabel="默认文字色"
      disabled={props.disabled}
      value={getTextColor(editor)}
      triggerContent={<Type className="h-4 w-4" />}
      onOpenChange={(open) => {
        if (open) cacheSelection();
      }}
      onTriggerMouseDown={() => {
        cacheSelection();
      }}
      onChange={onChangeColor}
    />
  );
}
