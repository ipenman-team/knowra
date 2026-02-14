import { Editor } from "slate";

import { getColorMark, setColorMark } from "../../editor-format";

export function getTextColor(editor: Editor) {
  return getColorMark(editor, "textColor");
}

export function runTextColor(editor: Editor, color: string | null) {
  setColorMark(editor, "textColor", color);
}
