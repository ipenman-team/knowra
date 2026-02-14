import { Editor } from "slate";

import { getColorMark, setColorMark } from "../../editor-format";

export function getBackgroundColor(editor: Editor) {
  return getColorMark(editor, "backgroundColor");
}

export function runBackgroundColor(editor: Editor, color: string | null) {
  setColorMark(editor, "backgroundColor", color);
}
