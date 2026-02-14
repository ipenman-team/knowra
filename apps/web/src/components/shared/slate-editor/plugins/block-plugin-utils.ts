import { Editor, Element as SlateElement, Node, Path, Transforms } from "slate";
import { ReactEditor } from "slate-react";

export function ensureTrailingEmptyParagraph(editor: Editor) {
  const lastNode = editor.children[editor.children.length - 1];
  if (lastNode && isEmptyParagraphNode(lastNode)) return;

  Transforms.insertNodes(editor, createEmptyParagraphNode(), {
    at: [editor.children.length],
    select: false,
  });
}

export function findElementPathSafe(editor: Editor, element: SlateElement) {
  try {
    return ReactEditor.findPath(editor as ReactEditor, element);
  } catch {
    return null;
  }
}

export function focusCursorAfterBlockElement(editor: Editor, element: SlateElement) {
  const path = findElementPathSafe(editor, element);
  if (!path) return;

  const nextPath = Path.next(path);
  const nextExists = hasNodeAt(editor, nextPath);

  if (!nextExists) {
    Transforms.insertNodes(editor, createEmptyParagraphNode(), {
      at: nextPath,
      select: false,
    });
  }

  Transforms.select(editor, Editor.start(editor, nextPath));
  ReactEditor.focus(editor as ReactEditor);
}

export function shouldIgnoreBlockPointerTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;

  return Boolean(
    target.closest(
      ".cm-editor, button, input, textarea, select, a, [role='combobox'], [role='switch']",
    ),
  );
}

function createEmptyParagraphNode() {
  return {
    type: "paragraph",
    children: [{ text: "" }],
  } as unknown as SlateElement;
}

function isEmptyParagraphNode(node: Node) {
  if (!SlateElement.isElement(node)) return false;
  if ((node as SlateElement & { type?: string }).type !== "paragraph") return false;
  return Node.string(node) === "";
}

function hasNodeAt(editor: Editor, path: Path) {
  try {
    Editor.node(editor, path);
    return true;
  } catch {
    return false;
  }
}
