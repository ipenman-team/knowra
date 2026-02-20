"use client";

import { useCallback, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Transforms, type Range } from "slate";
import { ReactEditor, useSlate } from "slate-react";

import { EmojiPicker } from "@/components/ui/emoji-picker";

import type { ToolbarPluginProps } from "../types";
import { insertEmoji } from "./logic";

export function EmojiPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();
  const selectionRef = useRef<Range | null>(null);
  const [lastEmoji, setLastEmoji] = useState<string | null>(null);

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

  const onEmojiChange = useCallback(
    (emoji: string | null) => {
      if (props.disabled) return;

      if (!emoji) {
        setLastEmoji(null);
        return;
      }

      restoreSelection();
      ReactEditor.focus(editor as ReactEditor);
      const inserted = insertEmoji(editor, emoji);
      if (!inserted) return;
      setLastEmoji(emoji);
    },
    [editor, props.disabled, restoreSelection],
  );

  return (
    <EmojiPicker
      label="插入 Emoji"
      disabled={props.disabled}
      value={lastEmoji}
      showClearButton={false}
      triggerIcon={<Smile className="h-4 w-4" />}
      showSelectedOnTrigger={false}
      placeholderEmoji="🙂"
      triggerClassName="h-8 w-8 p-0"
      contentClassName="w-[360px]"
      recentStorageKey="knowra:editor:emoji-recent"
      onChange={onEmojiChange}
      onOpenChange={(open) => {
        if (open) cacheSelection();
      }}
    />
  );
}
