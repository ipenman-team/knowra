"use client";

import { useCallback, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { ToolbarPluginProps } from "../types";
import { EMOJI_OPTIONS, insertEmoji } from "./logic";

export function EmojiPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);
  const [open, setOpen] = useState(false);

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

  const onSelectEmoji = useCallback(
    (emoji: string) => {
      if (props.disabled) return;

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      const inserted = insertEmoji(editor, emoji);
      if (!inserted) return;
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
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={open ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          disabled={props.disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            if (!open) cacheSelection();
            setOpen((prev) => !prev);
          }}
          aria-label="插入 Emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[280px] p-2" sideOffset={8}>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded text-lg",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                onSelectEmoji(emoji);
              }}
              aria-label={`插入 ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
