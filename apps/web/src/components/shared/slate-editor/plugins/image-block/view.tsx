"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useSlate } from "slate-react";
import { toast } from "sonner";

import { ToolbarButton } from "../toolbar-button";
import type { ToolbarPluginProps } from "../types";
import { insertImageBlock, isImageBlockActive } from "./logic";
import { uploadEditorImage } from "./upload";

export function ImageBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const disabled = Boolean(props.disabled || uploading);

  return (
    <>
      <ToolbarButton
        label="IMG"
        icon={
          uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )
        }
        active={isImageBlockActive(editor)}
        disabled={disabled}
        tooltip={uploading ? "图片上传中" : "图片"}
        onMouseDown={(event) => {
          event.preventDefault();
          inputRef.current?.click();
        }}
      />

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        disabled={disabled}
        onChange={(event) => {
          const target = event.currentTarget;
          const file = target.files?.[0] ?? null;
          target.value = "";

          if (!file) return;

          setUploading(true);

          void uploadEditorImage(file, "editor/image-picker")
            .then((url) => {
              insertImageBlock(editor, {
                url,
                alt: file.name || "image",
              });
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "图片上传失败";
              toast.error(message || "图片上传失败");
            })
            .finally(() => {
              setUploading(false);
            });
        }}
      />
    </>
  );
}
