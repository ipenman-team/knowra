import { Editor } from "slate";

import { isBlockActive, toggleBlock } from "../../editor-format";

export function isBlockQuoteActive(editor: Editor) {
  return isBlockActive(editor, "block-quote");
}

export function runBlockQuote(editor: Editor) {
  toggleBlock(editor, "block-quote");
}
