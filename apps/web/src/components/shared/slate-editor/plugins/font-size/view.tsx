"use client";

import { useCallback, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import {
  PopoverAnchor,
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { ToolbarPluginProps } from "../types";
import {
  DEFAULT_FONT_SIZE,
  FONT_SIZE_OPTIONS,
  getFontSizeMark,
  setFontSizeMark,
  type FontSizeValue,
} from "./logic";

export function FontSizePluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);

  const [open, setOpen] = useState(false);

  const activeSize = getFontSizeMark(editor);

  const cacheSelection = useCallback(() => {
    selectionRef.current = editor.selection;
  }, [editor]);

  const restoreSelection = useCallback(() => {
    if (!selectionRef.current) return;

    try {
      Transforms.select(editor, selectionRef.current);
    } catch {
      // ignore invalid selection
    }
  }, [editor]);

  const onApplySize = useCallback(
    (size: FontSizeValue) => {
      if (props.disabled) return;

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      setFontSizeMark(editor, size);
      setOpen(false);
    },
    [editor, props.disabled, restoreSelection],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) cacheSelection();
        setOpen(nextOpen);
      }}
    >
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant={open || activeSize !== DEFAULT_FONT_SIZE ? "secondary" : "ghost"}
          className="h-8 min-w-[74px] justify-between px-2"
          disabled={props.disabled}
          tooltip="字号"
          onMouseDown={(event) => {
            event.preventDefault();
            if (!open) cacheSelection();
            setOpen((prev) => !prev);
          }}
          aria-label="字号"
        >
          <span>{activeSize}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-[132px] p-1" sideOffset={8}>
        <div className="max-h-[360px] space-y-0.5 overflow-y-auto">
          {FONT_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted",
                activeSize === size && "bg-muted",
              )}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                onApplySize(size);
              }}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">
                {activeSize === size ? <Check className="h-4 w-4" /> : null}
              </span>
              <span>{size}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
