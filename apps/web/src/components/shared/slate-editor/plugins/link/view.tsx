"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { Range, Transforms, type BaseRange } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(DEFAULT_LINK_PLACEHOLDER_TEXT);
  const [url, setUrl] = useState(DEFAULT_LINK_PLACEHOLDER_URL);
  const [anchor, setAnchor] = useState<{ top: number; left: number; placeAbove: boolean } | null>(
    null,
  );
  const [preferAbove, setPreferAbove] = useState(false);

  const normalizedUrl = useMemo(() => normalizeLinkUrl(url), [url]);
  const hasValidationError = url.trim().length > 0 && !normalizedUrl;
  const canSubmit = Boolean(!props.disabled && normalizedUrl && text.trim().length > 0);

  const updateAnchor = useCallback(() => {
    const targetRange = selectionRef.current ?? editor.selection;
    if (!targetRange) return;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const panelWidth = 360;

    let rect: DOMRect | null = null;
    try {
      const domRange = ReactEditor.toDOMRange(editor as ReactEditor, targetRange);
      rect = domRange.getBoundingClientRect();
    } catch {
      rect = null;
    }

    if (!rect) return;

    const left = Math.min(
      Math.max(12, rect.left),
      Math.max(12, viewportWidth - panelWidth - 12),
    );
    const placeAbove = preferAbove;
    const top = placeAbove
      ? Math.min(Math.max(12, rect.top - 8), viewportHeight - 12)
      : Math.min(Math.max(12, rect.bottom + 8), viewportHeight - 12);

    setAnchor({ top, left, placeAbove });
  }, [editor, preferAbove]);

  const openEditor = useCallback(() => {
    if (props.disabled) return;
    if (!editor.selection) return;

    ReactEditor.focus(editor as ReactEditor);
    const activeSelection = editor.selection;
    const hadExpandedSelection = Range.isExpanded(activeSelection);
    setPreferAbove(hadExpandedSelection);

    if (hadExpandedSelection) {
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
    requestAnimationFrame(() => {
      updateAnchor();
    });
  }, [editor, props.disabled, updateAnchor]);

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

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onViewportChange = () => {
      updateAnchor();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      ReactEditor.focus(editor as ReactEditor);
    };

    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editor, open, updateAnchor]);

  return (
    <>
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

      {open && anchor ? (
        <div
          ref={panelRef}
          contentEditable={false}
          className="fixed z-50 w-[360px] space-y-5 rounded-md border border-input bg-background p-5 shadow-xl"
          style={{
            top: `${anchor.top}px`,
            left: `${anchor.left}px`,
            transform: anchor.placeAbove ? "translateY(-100%)" : undefined,
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
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
              placeholder="请输入链接"
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

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPreferAbove(false);
                ReactEditor.focus(editor as ReactEditor);
              }}
            >
              取消
            </Button>
            <Button type="button" disabled={!canSubmit} onClick={onConfirm}>
              应用
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
