"use client";

import { useCallback, useRef } from "react";
import { Eraser } from "lucide-react";
import { Range, Transforms } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { ColorPicker } from "@/components/ui/color-picker";

import type { ToolbarPluginProps } from "../types";
import {
  getBackgroundColor,
  getBackgroundColorAtCursorPath,
  runBackgroundColor,
} from "./logic";

export function BackgroundColorPluginView(props: ToolbarPluginProps) {
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
      runBackgroundColor(editor, color);
    },
    [editor, props.disabled, restoreSelection],
  );

  const activeBackgroundColor = getBackgroundColor(editor);
  const backgroundColorFallback = getBackgroundColorAtCursorPath(editor) ?? "#eab308";

  return (
    <ColorPicker
      label="文字背景色"
      defaultLabel="无背景色"
      disabled={props.disabled}
      value={activeBackgroundColor}
      triggerContent={<Eraser className="h-4 w-4 text-muted-foreground" />}
      triggerIndicatorFallbackColor={backgroundColorFallback}
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
