import { Editor } from "slate";

import { isListActive, toggleList } from "../../list-commands";

export function isNumberedListActive(editor: Editor) {
  return isListActive(editor, "numbered-list");
}

export function runNumberedList(editor: Editor) {
  toggleList(editor, "numbered-list");
}
