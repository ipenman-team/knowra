import { Editor } from "slate";

import { isListActive, toggleList } from "../../list-commands";

export function isBulletedListActive(editor: Editor) {
  return isListActive(editor, "bulleted-list");
}

export function runBulletedList(editor: Editor) {
  toggleList(editor, "bulleted-list");
}
