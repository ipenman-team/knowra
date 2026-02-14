import { Editor, Element as SlateElement, Transforms } from "slate";

import { toggleList } from "./list-commands";

export type BlockFormat =
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "block-quote"
  | "numbered-list"
  | "bulleted-list";

export type MarkFormat = "bold" | "italic" | "underline";
export type ColorMarkFormat = "textColor" | "backgroundColor";

const LIST_TYPES: BlockFormat[] = ["numbered-list", "bulleted-list"];

export function isMarkActive(editor: Editor, format: MarkFormat) {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  return Boolean(marks?.[format]);
}

export function toggleMark(editor: Editor, format: MarkFormat) {
  const active = isMarkActive(editor, format);
  if (active) Editor.removeMark(editor, format);
  else Editor.addMark(editor, format, true);
}

export function getColorMark(editor: Editor, format: ColorMarkFormat) {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  return normalizeColorMarkValue(marks?.[format]);
}

export function getColorMarkAtCursorPath(editor: Editor, format: ColorMarkFormat) {
  if (!editor.selection) return null;

  try {
    const [leaf] = Editor.leaf(editor, editor.selection.anchor.path);
    const leafRecord = leaf as unknown as Record<string, unknown>;
    return normalizeColorMarkValue(leafRecord[format]);
  } catch {
    return null;
  }
}

export function setColorMark(editor: Editor, format: ColorMarkFormat, value: string | null) {
  const nextValue = value?.trim() ?? "";
  if (nextValue) {
    Editor.addMark(editor, format, nextValue);
    return;
  }

  Editor.removeMark(editor, format);
}

function normalizeColorMarkValue(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function isBlockActive(editor: Editor, format: BlockFormat) {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n as SlateElement & { type?: string }).type === format,
  });
  return Boolean(match);
}

export function toggleBlock(editor: Editor, format: BlockFormat) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  if (isList) {
    toggleList(editor, format as Extract<BlockFormat, "numbered-list" | "bulleted-list">);
    return;
  }

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(
        ((n as SlateElement & { type?: string }).type ?? "paragraph") as BlockFormat,
      ),
    split: true,
  });

  const nextType = isActive ? "paragraph" : format;
  Transforms.setNodes(editor, { type: nextType } as unknown as Partial<SlateElement>, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
  });
}
