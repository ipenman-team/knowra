import { Editor } from "slate";

import { isMarkActive, toggleMark } from "../../editor-format";

export function isItalicActive(editor: Editor) {
  return isMarkActive(editor, "italic");
}

export function runItalic(editor: Editor) {
  toggleMark(editor, "italic");
}
