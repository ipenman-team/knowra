"use client";

import { useCallback } from "react";
import { ImageOff, Trash2 } from "lucide-react";
import { ReactEditor, useSlateStatic, type RenderElementProps } from "slate-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  getImageBlockAlt,
  getImageBlockUrl,
  removeImageBlock,
  type ImageBlockElement,
} from "./logic";

type ImageBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

export function ImageBlockElementView(props: ImageBlockElementViewProps) {
  const editor = useSlateStatic();
  const element = props.element as ImageBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);

  const imageUrl = getImageBlockUrl(element.url);
  const imageAlt = getImageBlockAlt(element.alt) || "image";

  const onDelete = useCallback(() => {
    const path = findPathSafe(editor as ReactEditor, element);
    if (!path) return;
    removeImageBlock(editor, path);
  }, [editor, element]);

  return (
    <div {...props.attributes} className="my-2">
      <div
        contentEditable={false}
        className={cn(
          "group relative overflow-hidden rounded-md border border-input bg-muted/20",
          "min-h-[120px]",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt}
            className="block max-h-[540px] w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            <ImageOff className="mr-2 h-4 w-4" /> 图片地址无效
          </div>
        )}

        {!readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 bg-background/85 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onDelete}
            aria-label="删除图片"
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>

      <span className="hidden">{props.children}</span>
    </div>
  );
}

function findPathSafe(editor: ReactEditor, element: ImageBlockElement) {
  try {
    return ReactEditor.findPath(editor, element);
  } catch {
    return null;
  }
}
