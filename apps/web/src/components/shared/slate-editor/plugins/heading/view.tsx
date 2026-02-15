"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { ToolbarPluginProps } from "../types";
import { HEADING_OPTIONS, getActiveHeadingFormat, setHeadingFormat, type HeadingOption } from "./logic";

function getHeadingOption(value: HeadingOption["value"]) {
  return HEADING_OPTIONS.find((item) => item.value === value) ?? HEADING_OPTIONS[0];
}

export function HeadingPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);

  const [open, setOpen] = useState(false);

  const activeFormat = getActiveHeadingFormat(editor);
  const activeOption = useMemo(() => getHeadingOption(activeFormat), [activeFormat]);

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

  const onApplyHeading = useCallback(
    (value: HeadingOption["value"]) => {
      if (props.disabled) return;

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      setHeadingFormat(editor, value);
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
          variant={open || activeOption.value !== "paragraph" ? "secondary" : "ghost"}
          className="h-8 min-w-[84px] justify-between px-2"
          disabled={props.disabled}
          tooltip="标题样式"
          onMouseDown={(event) => {
            event.preventDefault();
            if (!open) cacheSelection();
            setOpen((prev) => !prev);
          }}
          aria-label="标题样式"
        >
          <span>{activeOption.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-[220px] p-1" sideOffset={8}>
        <div className="space-y-0.5">
          {HEADING_OPTIONS.map((item) => {
            const active = item.value === activeOption.value;

            return (
              <button
                key={item.value}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-muted",
                  active && "bg-muted",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onApplyHeading(item.value);
                }}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  {active ? <Check className="h-4 w-4" /> : null}
                </span>
                <span className={cn("text-left leading-none", item.previewClassName)}>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
