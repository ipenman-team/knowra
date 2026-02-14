import { Editor, Element as SlateElement, Node, Path, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";

const BLOCK_PLUGIN_ROOT_TYPES = new Set(["code-block", "diagram-block", "image-block", "table-block"]);

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

export function insertParagraphAfterSelectedBlockPlugin(editor: Editor) {
  const blockPath = getSelectedBlockPluginPath(editor);
  if (!blockPath) return false;

  const nextPath = Path.next(blockPath);
  Transforms.insertNodes(editor, createEmptyParagraphNode(), {
    at: nextPath,
    select: false,
  });
  Transforms.select(editor, Editor.start(editor, nextPath));
  ReactEditor.focus(editor as ReactEditor);

  return true;
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

function getSelectedBlockPluginPath(editor: Editor) {
  if (!editor.selection || !Range.isCollapsed(editor.selection)) return null;

  const entry = Editor.above(editor, {
    at: editor.selection,
    mode: "lowest",
    match: (node) => isBlockPluginRootElement(editor, node),
  });

  if (!entry) return null;
  return entry[1];
}

function isBlockPluginRootElement(
  editor: Editor,
  node: unknown,
): node is SlateElement & { type?: string } {
  if (!SlateElement.isElement(node)) return false;
  if (!Editor.isBlock(editor, node)) return false;

  const type = (node as SlateElement & { type?: string }).type;
  return BLOCK_PLUGIN_ROOT_TYPES.has(type ?? "");
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
