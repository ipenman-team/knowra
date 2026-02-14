import { Editor } from "slate";

import { getColorMark, getColorMarkAtCursorPath, setColorMark } from "../../editor-format";

export function getTextColor(editor: Editor) {
  return getColorMark(editor, "textColor");
}

export function getTextColorAtCursorPath(editor: Editor) {
  return getColorMarkAtCursorPath(editor, "textColor");
}

export function runTextColor(editor: Editor, color: string | null) {
  setColorMark(editor, "textColor", color);
}
