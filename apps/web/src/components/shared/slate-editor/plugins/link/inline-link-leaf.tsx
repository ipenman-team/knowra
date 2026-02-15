"use client";

import { useCallback, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Link2Off, PencilLine } from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useReadOnly, useSlateStatic } from "slate-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  DEFAULT_LINK_PLACEHOLDER_TEXT,
  DEFAULT_LINK_PLACEHOLDER_URL,
  LINK_MARK,
  getLinkAtSelection,
  insertLinkText,
  normalizeLinkUrl,
  removeLinkMark,
} from "./logic";

type InlineLinkLeafProps = {
  children: ReactNode;
  href: string;
  pluginScope?: string;
  pluginKind?: string;
};

type InlineLinkPopoverMode = "actions" | "editor";

export function InlineLinkLeaf(props: InlineLinkLeafProps) {
  const editor = useSlateStatic();
  const readOnly = useReadOnly();

  const selectionRef = useRef<Range | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InlineLinkPopoverMode>("actions");
  const [text, setText] = useState(DEFAULT_LINK_PLACEHOLDER_TEXT);
  const [url, setUrl] = useState(props.href);

  const normalizedUrl = useMemo(() => normalizeLinkUrl(url), [url]);
  const hasValidationError = url.trim().length > 0 && !normalizedUrl;
  const canSubmit = Boolean(normalizedUrl && text.trim().length > 0);

  const hydrateFromCurrentSelection = useCallback(
    (fallbackUrl: string) => {
      const active = getLinkAtSelection(editor);
      if (!active) return false;

      selectionRef.current = active.range;
      setText(active.text || DEFAULT_LINK_PLACEHOLDER_TEXT);
      setUrl(active.url || fallbackUrl || DEFAULT_LINK_PLACEHOLDER_URL);
      return true;
    },
    [editor],
  );

  const onEditConfirm = useCallback(() => {
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

    const next = getLinkAtSelection(editor);
    if (next) selectionRef.current = next.range;

    setMode("actions");
    setOpen(false);
  }, [canSubmit, editor, text, url]);

  const onRemoveLink = useCallback(() => {
    if (!selectionRef.current) return;

    try {
      Transforms.select(editor, selectionRef.current);
    } catch {
      // ignore invalid selection
    }

    removeLinkMark(editor, selectionRef.current);
    ReactEditor.focus(editor as ReactEditor);
    setOpen(false);
    setMode("actions");
  }, [editor]);

  const onOpenActions = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (readOnly) return;
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      ReactEditor.focus(editor as ReactEditor);
      try {
        const range = ReactEditor.findEventRange(editor as ReactEditor, event);
        Transforms.select(editor, range);
      } catch {
        // ignore invalid range
      }

      const hydrated = hydrateFromCurrentSelection(props.href);
      if (!hydrated) return;

      setMode("actions");
      setOpen(true);
    },
    [editor, hydrateFromCurrentSelection, props.href, readOnly],
  );

  const trigger = (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-pointer text-blue-500 hover:underline"
      data-plugin-scope={props.pluginScope}
      data-plugin-kind={props.pluginKind ?? LINK_MARK}
      onMouseDown={onOpenActions}
      onClick={(event) => {
        if (readOnly) return;
        event.preventDefault();
      }}
    >
      {props.children}
    </a>
  );

  if (readOnly) return trigger;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setMode("actions");
      }}
    >
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className={cn(mode === "editor" ? "w-[360px] space-y-5" : "w-auto p-2")}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          ReactEditor.focus(editor as ReactEditor);
        }}
        onMouseDown={
          mode === "actions"
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
      >
        {mode === "actions" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="max-w-[260px] truncate px-2 text-left text-base text-blue-500"
              onClick={(event) => {
                event.preventDefault();
                window.open(normalizedUrl ?? props.href, "_blank", "noopener,noreferrer");
              }}
            >
              {normalizedUrl ?? props.href}
            </button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              tooltip="编辑链接"
              onClick={() => setMode("editor")}
            >
              <PencilLine className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              tooltip="取消链接"
              onClick={onRemoveLink}
            >
              <Link2Off className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
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
                  onEditConfirm();
                }}
              />
              {hasValidationError ? (
                <p className="text-sm text-destructive">请输入正确的链接</p>
              ) : null}
            </div>

            <Button type="button" variant="outline" disabled={!canSubmit} onClick={onEditConfirm}>
              确定
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
