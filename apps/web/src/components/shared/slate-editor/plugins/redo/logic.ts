import type { BaseEditor } from "slate";

type RedoableEditor = BaseEditor & {
  redo?: () => void;
};

export function runRedo(editor: BaseEditor) {
  (editor as RedoableEditor).redo?.();
}
