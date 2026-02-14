import type { BaseEditor } from "slate";

type UndoableEditor = BaseEditor & {
  undo?: () => void;
};

export function runUndo(editor: BaseEditor) {
  (editor as UndoableEditor).undo?.();
}
