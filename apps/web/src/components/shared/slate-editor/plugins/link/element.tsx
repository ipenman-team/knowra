"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link2Off, PencilLine } from "lucide-react";
import { Editor, Transforms, type BaseRange } from "slate";
import {
  ReactEditor,
  useReadOnly,
  useSlateStatic,
  type RenderElementProps,
} from "slate-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  DEFAULT_LINK_PLACEHOLDER_TEXT,
  DEFAULT_LINK_PLACEHOLDER_URL,
  LINK_MARK,
  insertLinkText,
  normalizeLinkUrl,
  removeLinkMark,
  type LinkElement,
} from "./logic";

type LinkElementViewProps = RenderElementProps & {
  children: ReactNode;
};

type LinkPopoverMode = "actions" | "editor";

export function LinkElementView(props: LinkElementViewProps) {
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const element = props.element as LinkElement;

  const selectionRef = useRef<BaseRange | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<LinkPopoverMode>("actions");
  const [text, setText] = useState(DEFAULT_LINK_PLACEHOLDER_TEXT);
  const [url, setUrl] = useState(element.url ?? DEFAULT_LINK_PLACEHOLDER_URL);

  const normalizedUrl = useMemo(() => normalizeLinkUrl(url), [url]);
  const hasValidationError = url.trim().length > 0 && !normalizedUrl;
  const canSubmit = Boolean(normalizedUrl && text.trim().length > 0);

  const getElementRange = useCallback(() => {
    try {
      const path = ReactEditor.findPath(editor as ReactEditor, element);
      return Editor.range(editor, path);
    } catch {
      return selectionRef.current;
    }
  }, [editor, element]);

  const openActions = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (readOnly) return;
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      const range = getElementRange();
      if (!range) return;

      selectionRef.current = range;
      try {
        Transforms.select(editor, range);
      } catch {
        // ignore invalid range
      }

      setText(Editor.string(editor, range) || DEFAULT_LINK_PLACEHOLDER_TEXT);
      setUrl(normalizeLinkUrl(element.url) ?? DEFAULT_LINK_PLACEHOLDER_URL);
      setMode("actions");
      setOpen(true);
      ReactEditor.focus(editor as ReactEditor);
    },
    [editor, element.url, getElementRange, readOnly],
  );

  const onEditConfirm = useCallback(() => {
    if (!canSubmit) return;

    const range = getElementRange();
    if (!range) return;

    selectionRef.current = range;
    const inserted = insertLinkText(editor, {
      text,
      url,
      selection: range,
    });
    if (!inserted) return;

    setMode("actions");
    setOpen(false);
    ReactEditor.focus(editor as ReactEditor);
  }, [canSubmit, editor, getElementRange, text, url]);

  const onRemoveLink = useCallback(() => {
    const range = getElementRange();
    if (!range) return;

    selectionRef.current = range;
    removeLinkMark(editor, range);
    setOpen(false);
    setMode("actions");
    ReactEditor.focus(editor as ReactEditor);
  }, [editor, getElementRange]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setMode("actions");
      }}
    >
      <PopoverAnchor asChild>
        <a
          {...props.attributes}
          href={normalizeLinkUrl(element.url) ?? element.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-blue-500 hover:underline"
          data-plugin-scope={element.pluginScope}
          data-plugin-kind={element.pluginKind ?? LINK_MARK}
          onMouseDown={openActions}
          onClick={(event) => {
            if (readOnly) return;
            event.preventDefault();
          }}
        >
          {props.children}
        </a>
      </PopoverAnchor>

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
                window.open(normalizedUrl ?? element.url, "_blank", "noopener,noreferrer");
              }}
            >
              {normalizedUrl ?? element.url}
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

