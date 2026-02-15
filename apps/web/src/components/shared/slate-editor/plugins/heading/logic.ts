import { Editor, Element as SlateElement } from "slate";

import { isBlockActive, toggleBlock, type BlockFormat } from "../../editor-format";

export type HeadingFormat =
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "heading-three"
  | "heading-four"
  | "heading-five"
  | "heading-six";

export type HeadingOption = {
  value: HeadingFormat;
  label: string;
  shortcut: string;
  previewClassName: string;
};

export const HEADING_OPTIONS: HeadingOption[] = [
  { value: "paragraph", label: "正文", shortcut: "⌥⌘0", previewClassName: "text-[44px] font-semibold" },
  { value: "heading-one", label: "标题1", shortcut: "⌥⌘1", previewClassName: "text-[52px] font-bold" },
  { value: "heading-two", label: "标题2", shortcut: "⌥⌘2", previewClassName: "text-[46px] font-bold" },
  { value: "heading-three", label: "标题3", shortcut: "⌥⌘3", previewClassName: "text-[40px] font-semibold" },
  { value: "heading-four", label: "标题4", shortcut: "⌥⌘4", previewClassName: "text-[34px] font-semibold" },
  { value: "heading-five", label: "标题5", shortcut: "⌥⌘5", previewClassName: "text-[30px] font-medium" },
  { value: "heading-six", label: "标题6", shortcut: "⌥⌘6", previewClassName: "text-[28px] font-medium" },
];

const HEADING_VALUE_SET = new Set<HeadingFormat>(HEADING_OPTIONS.map((item) => item.value));

export function getActiveHeadingFormat(editor: Editor): HeadingFormat {
  if (!editor.selection) return "paragraph";

  const [entry] = Editor.nodes(editor, {
    at: editor.selection,
    mode: "lowest",
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });
  if (!entry) return "paragraph";

  const blockType = ((entry[0] as SlateElement & { type?: string }).type ?? "paragraph") as HeadingFormat;
  if (HEADING_VALUE_SET.has(blockType)) return blockType;
  return "paragraph";
}

export function setHeadingFormat(editor: Editor, format: HeadingFormat) {
  if (isBlockActive(editor, format)) return;
  toggleBlock(editor, format as BlockFormat);
}
