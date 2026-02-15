"use client";

import { useCallback, useMemo, useRef, useState, type ComponentType } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
} from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

import type { ToolbarPluginProps } from "../types";
import { getBlockAlign, setBlockAlign, type AlignFormat } from "./logic";

const ALIGN_ITEMS: {
  value: AlignFormat;
  label: string;
  shortcut: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "left", label: "左对齐", shortcut: "Shift+Cmd+L", icon: AlignLeft },
  { value: "center", label: "居中对齐", shortcut: "Shift+Cmd+C", icon: AlignCenter },
  { value: "right", label: "右对齐", shortcut: "Shift+Cmd+R", icon: AlignRight },
  { value: "justify", label: "两端对齐", shortcut: "Shift+Cmd+J", icon: AlignJustify },
];

export function AlignPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);

  const [open, setOpen] = useState(false);

  const activeAlign = getBlockAlign(editor);

  const ActiveIcon = useMemo(() => {
    return ALIGN_ITEMS.find((item) => item.value === activeAlign)?.icon ?? AlignLeft;
  }, [activeAlign]);

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

  const onApplyAlign = useCallback(
    (align: AlignFormat) => {
      if (props.disabled) return;

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      setBlockAlign(editor, align);
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
          variant={open || activeAlign !== "left" ? "secondary" : "ghost"}
          className="h-8 gap-1 px-1.5"
          disabled={props.disabled}
          tooltip="对齐方式"
          onMouseDown={(event) => {
            event.preventDefault();
            if (!open) cacheSelection();
            setOpen((prev) => !prev);
          }}
          aria-label="对齐方式"
        >
          <ActiveIcon className="h-4 w-4" />
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-auto p-2" sideOffset={8}>
        <div className="flex items-center gap-1">
          {ALIGN_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <Button
                key={item.value}
                type="button"
                variant={activeAlign === item.value ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9"
                tooltip={`${item.label} (${item.shortcut})`}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onApplyAlign(item.value);
                }}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
