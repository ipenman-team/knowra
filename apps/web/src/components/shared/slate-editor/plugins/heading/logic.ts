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
};

export const HEADING_OPTIONS: HeadingOption[] = [
  { value: "paragraph", label: "正文" },
  { value: "heading-one", label: "标题1" },
  { value: "heading-two", label: "标题2" },
  { value: "heading-three", label: "标题3" },
  { value: "heading-four", label: "标题4" },
  { value: "heading-five", label: "标题5" },
  { value: "heading-six", label: "标题6" },
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
