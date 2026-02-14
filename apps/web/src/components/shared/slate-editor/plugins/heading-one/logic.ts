import { Editor } from "slate";

import { isBlockActive, toggleBlock } from "../../editor-format";

export function isHeadingOneActive(editor: Editor) {
  return isBlockActive(editor, "heading-one");
}

export function runHeadingOne(editor: Editor) {
  toggleBlock(editor, "heading-one");
}
