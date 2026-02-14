import { Editor } from "slate";

export const FONT_SIZE_MARK = "fontSize";

export const FONT_SIZE_OPTIONS = [
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "19px",
  "22px",
  "24px",
  "29px",
  "32px",
  "40px",
  "48px",
] as const;

export type FontSizeValue = (typeof FONT_SIZE_OPTIONS)[number];

export const DEFAULT_FONT_SIZE: FontSizeValue = "15px";

const FONT_SIZE_SET = new Set<FontSizeValue>(FONT_SIZE_OPTIONS);

export function normalizeFontSize(value?: string | null): FontSizeValue | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase() as FontSizeValue;
  if (!FONT_SIZE_SET.has(normalized)) return null;
  return normalized;
}

export function getFontSizeMark(editor: Editor): FontSizeValue {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  const value = marks?.[FONT_SIZE_MARK];

  const normalized = normalizeFontSize(typeof value === "string" ? value : null);
  return normalized ?? DEFAULT_FONT_SIZE;
}

export function setFontSizeMark(editor: Editor, value: string) {
  const normalized = normalizeFontSize(value) ?? DEFAULT_FONT_SIZE;

  if (normalized === DEFAULT_FONT_SIZE) {
    Editor.removeMark(editor, FONT_SIZE_MARK);
    return;
  }

  Editor.addMark(editor, FONT_SIZE_MARK, normalized);
}
