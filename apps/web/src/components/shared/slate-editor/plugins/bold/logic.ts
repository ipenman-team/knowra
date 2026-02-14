import { Editor } from "slate";

import { isMarkActive, toggleMark } from "../../editor-format";

export function isBoldActive(editor: Editor) {
  return isMarkActive(editor, "bold");
}

export function runBold(editor: Editor) {
  toggleMark(editor, "bold");
}
