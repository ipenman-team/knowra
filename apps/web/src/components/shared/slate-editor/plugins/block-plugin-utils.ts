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

  const scrollSnapshots = captureScrollSnapshots(editor);
  Transforms.select(editor, Editor.start(editor, nextPath));
  focusEditorWithoutScroll(editor);

  window.requestAnimationFrame(() => {
    restoreScrollSnapshots(scrollSnapshots);
  });
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

  const inTableCell = Editor.above(editor, {
    at: editor.selection,
    match: (node) =>
      SlateElement.isElement(node) &&
      (node as SlateElement & { type?: string }).type === "table-cell",
  });
  if (inTableCell) return null;

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

type ScrollSnapshot = {
  element: HTMLElement | null;
  left: number;
  top: number;
};

function focusEditorWithoutScroll(editor: Editor) {
  const reactEditor = editor as ReactEditor;

  try {
    const domNode = ReactEditor.toDOMNode(reactEditor, reactEditor);
    if (domNode instanceof HTMLElement) {
      domNode.focus({ preventScroll: true });
      return;
    }
  } catch {
    // Ignore and fallback to react-editor focus.
  }

  ReactEditor.focus(reactEditor);
}

function captureScrollSnapshots(editor: Editor) {
  const snapshots: ScrollSnapshot[] = [
    { element: null, left: window.scrollX, top: window.scrollY },
  ];

  const reactEditor = editor as ReactEditor;
  let current: HTMLElement | null = null;

  try {
    const domNode = ReactEditor.toDOMNode(reactEditor, reactEditor);
    if (domNode instanceof HTMLElement) current = domNode.parentElement;
  } catch {
    current = null;
  }

  while (current) {
    if (isScrollableElement(current)) {
      snapshots.push({
        element: current,
        left: current.scrollLeft,
        top: current.scrollTop,
      });
    }
    current = current.parentElement;
  }

  return snapshots;
}

function restoreScrollSnapshots(snapshots: ScrollSnapshot[]) {
  for (const snapshot of snapshots) {
    if (snapshot.element) {
      snapshot.element.scrollLeft = snapshot.left;
      snapshot.element.scrollTop = snapshot.top;
      continue;
    }

    window.scrollTo({
      left: snapshot.left,
      top: snapshot.top,
      behavior: "auto",
    });
  }
}

function isScrollableElement(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;

  const canScrollY =
    (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
    element.scrollHeight > element.clientHeight;
  const canScrollX =
    (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
    element.scrollWidth > element.clientWidth;

  return canScrollY || canScrollX;
}
