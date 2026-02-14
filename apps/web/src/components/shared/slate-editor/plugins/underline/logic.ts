import { Editor } from "slate";

import { isMarkActive, toggleMark } from "../../editor-format";

export function isUnderlineActive(editor: Editor) {
  return isMarkActive(editor, "underline");
}

export function runUnderline(editor: Editor) {
  toggleMark(editor, "underline");
}
