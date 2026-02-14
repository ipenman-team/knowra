"use client";

import { useCallback, useRef } from "react";
import { Range, Transforms } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { ColorPicker } from "@/components/ui/color-picker";

import type { ToolbarPluginProps } from "../types";
import { getTextColor, getTextColorAtCursorPath, runTextColor } from "./logic";

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

  const activeTextColor = getTextColor(editor);
  const textColorFallback = getTextColorAtCursorPath(editor) ?? "#ef4444";

  return (
    <ColorPicker
      label="文字颜色"
      defaultLabel="默认文字色"
      disabled={props.disabled}
      value={activeTextColor}
      triggerContent={<span className="text-lg leading-none text-muted-foreground">A</span>}
      triggerIndicatorFallbackColor={textColorFallback}
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
