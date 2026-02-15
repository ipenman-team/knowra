"use client";

import { useCallback } from "react";
import { ImageOff } from "lucide-react";
import {
  useFocused,
  useSelected,
  useSlateStatic,
  type RenderElementProps,
} from "slate-react";

import { cn } from "@/lib/utils";

import { BlockElementHandleMenu } from "../block-element-handle-menu";
import {
  findElementPathSafe,
  focusCursorAfterBlockElement,
  shouldIgnoreBlockPointerTarget,
} from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK } from "../types";
import {
  getImageBlockAlt,
  getImageBlockUrl,
  IMAGE_BLOCK_TYPE,
  removeImageBlock,
  type ImageBlockElement,
} from "./logic";

type ImageBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

export function ImageBlockElementView(props: ImageBlockElementViewProps) {
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const element = props.element as ImageBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);
  const isActive = selected && focused;

  const imageUrl = getImageBlockUrl(element.url);
  const imageAlt = getImageBlockAlt(element.alt) || "image";

  const onDelete = useCallback(() => {
    const path = findElementPathSafe(editor, element);
    if (!path) return;
    removeImageBlock(editor, path);
  }, [editor, element]);

  const onMoveCursorAfterByContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (readOnly || !selected) return;
      if (shouldIgnoreBlockPointerTarget(event.target)) return;
      focusCursorAfterBlockElement(editor, element);
    },
    [editor, element, readOnly, selected],
  );

  return (
    <div
      {...props.attributes}
      data-plugin-scope={element.pluginScope ?? PLUGIN_SCOPE_BLOCK}
      data-plugin-kind={element.pluginKind ?? IMAGE_BLOCK_TYPE}
      className="group/block relative my-2"
      onContextMenuCapture={onMoveCursorAfterByContextMenu}
    >
      {!readOnly ? (
        <BlockElementHandleMenu active={isActive} onDelete={onDelete} deleteLabel="删除图片" />
      ) : null}

      <div
        contentEditable={false}
        className={cn(
          "relative overflow-hidden rounded-md border border-input bg-muted/20 transition-colors",
          "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/60",
          isActive && "border-blue-500 ring-1 ring-blue-500/60",
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
      </div>

      <span className="hidden">{props.children}</span>
    </div>
  );
}
