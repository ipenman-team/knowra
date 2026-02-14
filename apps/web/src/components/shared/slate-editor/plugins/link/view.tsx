"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { Transforms, type Range } from "slate";
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
  getLinkMark,
  getSelectionText,
  insertLinkText,
  normalizeLinkUrl,
} from "./logic";

export function LinkPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("http://");

  const normalizedUrl = useMemo(() => normalizeLinkUrl(url), [url]);
  const hasValidationError = url.trim().length > 0 && !normalizedUrl;
  const canSubmit = Boolean(!props.disabled && normalizedUrl && text.trim().length > 0);

  const snapshotSelection = useCallback(() => {
    selectionRef.current = editor.selection;
  }, [editor]);

  const hydrateFromSelection = useCallback(() => {
    const selectedText = getSelectionText(editor, selectionRef.current);
    const activeLink = getLinkMark(editor);

    setText(selectedText);
    setUrl(activeLink ?? "http://");
  }, [editor]);

  const toggleOpen = useCallback(() => {
    if (props.disabled) return;

    if (!open) {
      snapshotSelection();
      hydrateFromSelection();
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [hydrateFromSelection, open, props.disabled, snapshotSelection]);

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
          onMouseDown={(event) => {
            event.preventDefault();
            toggleOpen();
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
            placeholder="这是一个链接"
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">链接</div>
          <Input
            value={url}
            placeholder="http://example.com"
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
