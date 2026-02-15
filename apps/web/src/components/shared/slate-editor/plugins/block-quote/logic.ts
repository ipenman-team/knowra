import { Editor, Element as SlateElement, Node, Path, Range, Transforms } from "slate";

const BLOCK_QUOTE_TYPE = "block-quote";

import { isBlockActive, toggleBlock } from "../../editor-format";

export function isBlockQuoteActive(editor: Editor) {
  return isBlockActive(editor, BLOCK_QUOTE_TYPE);
}

export function runBlockQuote(editor: Editor) {
  toggleBlock(editor, BLOCK_QUOTE_TYPE);
}

export function handleEnterInBlockQuote(editor: Editor) {
  if (!editor.selection || !Range.isCollapsed(editor.selection)) return false;

  const blockQuoteEntry = Editor.above(editor, {
    at: editor.selection,
    mode: "lowest",
    match: (node) =>
      SlateElement.isElement(node) &&
      (node as SlateElement & { type?: string }).type === BLOCK_QUOTE_TYPE,
  }) as [SlateElement & { type: typeof BLOCK_QUOTE_TYPE }, Path] | undefined;
  if (!blockQuoteEntry) return false;

  const [blockQuoteNode, blockQuotePath] = blockQuoteEntry;
  const isEmpty = Node.string(blockQuoteNode).trim() === "";
  if (!isEmpty) {
    Editor.insertSoftBreak(editor);
    return true;
  }

  Transforms.setNodes(
    editor,
    { type: "paragraph" } as unknown as Partial<SlateElement>,
    { at: blockQuotePath },
  );

  return true;
}
