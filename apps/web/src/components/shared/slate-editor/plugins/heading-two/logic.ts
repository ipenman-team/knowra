import { Editor } from "slate";

import { isBlockActive, toggleBlock } from "../../editor-format";

export function isHeadingTwoActive(editor: Editor) {
  return isBlockActive(editor, "heading-two");
}

export function runHeadingTwo(editor: Editor) {
  toggleBlock(editor, "heading-two");
}
