"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { Range, Transforms, type BaseRange } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { ToolbarPluginProps } from "../types";
import {
  DEFAULT_LINK_PLACEHOLDER_TEXT,
  DEFAULT_LINK_PLACEHOLDER_URL,
  getLinkMark,
  getSelectionText,
  insertLinkText,
  normalizeLinkUrl,
} from "./logic";

export function LinkPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<BaseRange | null>(null);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(DEFAULT_LINK_PLACEHOLDER_TEXT);
  const [url, setUrl] = useState(DEFAULT_LINK_PLACEHOLDER_URL);

  const normalizedUrl = useMemo(() => normalizeLinkUrl(url), [url]);
  const hasValidationError = url.trim().length > 0 && !normalizedUrl;
  const canSubmit = Boolean(!props.disabled && normalizedUrl && text.trim().length > 0);

  const openEditor = useCallback(() => {
    if (props.disabled) return;
    if (!editor.selection) return;

    ReactEditor.focus(editor as ReactEditor);
    const activeSelection = editor.selection;

    if (Range.isExpanded(activeSelection)) {
      selectionRef.current = activeSelection;
      setText(getSelectionText(editor, activeSelection) || DEFAULT_LINK_PLACEHOLDER_TEXT);
      setUrl(getLinkMark(editor) ?? DEFAULT_LINK_PLACEHOLDER_URL);
      setOpen(true);
      return;
    }

    const start = {
      path: [...activeSelection.anchor.path],
      offset: activeSelection.anchor.offset,
    };

    Transforms.insertText(editor, DEFAULT_LINK_PLACEHOLDER_TEXT);

    const end = editor.selection?.anchor;
    if (end) {
      const insertedRange: BaseRange = { anchor: start, focus: end };
      selectionRef.current = insertedRange;
      try {
        Transforms.select(editor, insertedRange);
      } catch {
        // ignore invalid selection
      }
    } else {
      selectionRef.current = activeSelection;
    }

    setText(DEFAULT_LINK_PLACEHOLDER_TEXT);
    setUrl(DEFAULT_LINK_PLACEHOLDER_URL);
    setOpen(true);
  }, [editor, props.disabled]);

  const onConfirm = useCallback(() => {
    if (!canSubmit) return;

    if (selectionRef.current) {
      try {
        Transforms.select(editor, selectionRef.current);
      } catch {
        // ignore invalid selection
      }
    }

    ReactEditor.focus(editor as ReactEditor);

    const inserted = insertLinkText(editor, {
      text,
      url,
      selection: selectionRef.current,
    });

    if (!inserted) return;

    setOpen(false);
  }, [canSubmit, editor, text, url]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant={getLinkMark(editor) ? "secondary" : "ghost"}
          className="h-8 px-2"
          disabled={props.disabled}
          tooltip="插入链接"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openEditor();
          }}
          aria-label="插入链接"
        >
          <Link2 />
        </Button>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] space-y-5"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium">文本</div>
          <Input
            value={text}
            placeholder={DEFAULT_LINK_PLACEHOLDER_TEXT}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">链接</div>
          <Input
            value={url}
            placeholder="链接地址"
            aria-invalid={hasValidationError}
            className={cn(
              hasValidationError && "border-destructive focus-visible:ring-destructive",
            )}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onConfirm();
            }}
          />
          {hasValidationError ? (
            <p className="text-sm text-destructive">请输入正确的链接</p>
          ) : null}
        </div>

        <Button type="button" variant="outline" disabled={!canSubmit} onClick={onConfirm}>
          确定
        </Button>
      </PopoverContent>
    </Popover>
  );
}
