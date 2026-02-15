import {
  Descendant,
  Editor,
  Element as SlateElement,
  Node,
  Path,
  Transforms,
  type NodeEntry,
} from "slate";

import { ensureTrailingEmptyParagraph } from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK, type PluginMarkerFields } from "../types";

export const TABLE_BLOCK_TYPE = "table-block";
export const TABLE_ROW_TYPE = "table-row";
export const TABLE_CELL_TYPE = "table-cell";

export const DEFAULT_TABLE_ROWS = 3;
export const DEFAULT_TABLE_COLUMNS = 3;
export const DEFAULT_TABLE_COLUMN_WIDTH = 240;
export const DEFAULT_TABLE_ROW_HEIGHT = 110;
export const MIN_TABLE_COLUMN_WIDTH = 120;
export const MAX_TABLE_COLUMN_WIDTH = 720;
export const MIN_TABLE_ROW_HEIGHT = 52;
export const MAX_TABLE_ROW_HEIGHT = 420;

export type TableCellElement = SlateElement & {
  type: typeof TABLE_CELL_TYPE;
  width?: number;
  children: Descendant[];
};

export type TableRowElement = SlateElement & {
  type: typeof TABLE_ROW_TYPE;
  height?: number;
  children: TableCellElement[];
};

export type TableBlockElement = SlateElement &
  PluginMarkerFields & {
    type: typeof TABLE_BLOCK_TYPE;
    children: TableRowElement[];
  };

export function withTableBlock<T extends Editor>(editor: T): T {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (isTableBlockElement(node)) {
      if (hasTableAncestor(editor, path)) {
        Transforms.removeNodes(editor, { at: path });
        return;
      }

      if (node.children.length === 0) {
        Transforms.insertNodes(editor, createTableRowElement(DEFAULT_TABLE_COLUMNS), {
          at: [...path, 0],
        });
        return;
      }

      const firstRow = node.children[0];
      if (!isTableRowElement(firstRow)) {
        Transforms.removeNodes(editor, { at: [...path, 0] });
        return;
      }

      const columnCount = getTableColumnCount(node);

      for (let rowIndex = 0; rowIndex < node.children.length; rowIndex += 1) {
        const row = node.children[rowIndex];
        const rowPath = [...path, rowIndex];

        if (!isTableRowElement(row)) {
          Transforms.removeNodes(editor, { at: rowPath });
          return;
        }

        if (row.children.length === 0) {
          Transforms.insertNodes(editor, createTableCellElement(DEFAULT_TABLE_COLUMN_WIDTH), {
            at: [...rowPath, 0],
          });
          return;
        }

        if (row.children.length < columnCount) {
          const cells = Array.from({ length: columnCount - row.children.length }, () =>
            createTableCellElement(DEFAULT_TABLE_COLUMN_WIDTH),
          );
          Transforms.insertNodes(editor, cells, { at: [...rowPath, row.children.length] });
          return;
        }

        if (row.children.length > columnCount) {
          Transforms.removeNodes(editor, { at: [...rowPath, columnCount] });
          return;
        }
      }
    }

    if (isTableCellElement(node)) {
      if (node.children.length === 0) {
        Transforms.insertNodes(editor, createEmptyParagraph(), { at: [...path, 0] });
        return;
      }

      for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
        const child = node.children[childIndex];
        const childPath = [...path, childIndex];

        if (isTableBlockElement(child)) {
          Transforms.removeNodes(editor, { at: childPath });
          Transforms.insertNodes(editor, createEmptyParagraph(), { at: childPath });
          return;
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
}

export function isTableBlockElement(node: unknown): node is TableBlockElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === TABLE_BLOCK_TYPE
  );
}

export function isTableRowElement(node: unknown): node is TableRowElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === TABLE_ROW_TYPE
  );
}

export function isTableCellElement(node: unknown): node is TableCellElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === TABLE_CELL_TYPE
  );
}

export function isTableBlockActive(editor: Editor) {
  const [entry] = Editor.nodes(editor, {
    match: (node) => isTableBlockElement(node),
  });
  return Boolean(entry);
}

export function isSelectionInTable(editor: Editor) {
  if (!editor.selection) return false;

  const [entry] = Editor.nodes(editor, {
    at: editor.selection,
    match: (node) => isTableBlockElement(node),
  });

  return Boolean(entry);
}

export function insertTableBlock(editor: Editor) {
  if (isSelectionInTable(editor)) return false;

  const blockEntry = Editor.above(editor, {
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });

  const at = blockEntry ? Path.next(blockEntry[1]) : [editor.children.length];
  const table = createTableBlockElement(DEFAULT_TABLE_ROWS, DEFAULT_TABLE_COLUMNS);

  Transforms.insertNodes(editor, table as unknown as SlateElement, { at, select: true });
  ensureTrailingEmptyParagraph(editor);
  Transforms.select(editor, Editor.start(editor, [...at, 0, 0]));
  return true;
}

export function insertTableRow(editor: Editor, tablePath: Path, afterRowIndex?: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table) return false;

  const rowCount = table.children.length;
  const columnWidths = getTableColumnWidths(table);
  const baseRowIndex = clampIndex(afterRowIndex, rowCount - 1);
  const insertIndex = rowCount === 0 ? 0 : baseRowIndex + 1;
  const rowHeight = getTableRowHeight(table.children[baseRowIndex]?.height);

  Transforms.insertNodes(
    editor,
    createTableRowElement(columnWidths.length, columnWidths, rowHeight) as unknown as SlateElement,
    { at: [...tablePath, insertIndex], select: true },
  );

  Transforms.select(editor, Editor.start(editor, [...tablePath, insertIndex, 0]));
  return true;
}

export function insertTableColumn(editor: Editor, tablePath: Path, afterColumnIndex?: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table) return false;

  const rowCount = table.children.length;
  const columnWidths = getTableColumnWidths(table);
  const columnCount = columnWidths.length;
  const baseColumnIndex = clampIndex(afterColumnIndex, columnCount - 1);
  const insertIndex = columnCount === 0 ? 0 : baseColumnIndex + 1;
  const nextWidth = columnWidths[baseColumnIndex] ?? DEFAULT_TABLE_COLUMN_WIDTH;

  Editor.withoutNormalizing(editor, () => {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const cellPath = [...tablePath, rowIndex, insertIndex];
      Transforms.insertNodes(editor, createTableCellElement(nextWidth) as unknown as SlateElement, {
        at: cellPath,
      });
    }
  });

  if (rowCount > 0) {
    Transforms.select(editor, Editor.start(editor, [...tablePath, 0, insertIndex]));
  }

  return true;
}

export function resizeTableColumn(editor: Editor, tablePath: Path, columnIndex: number, width: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table) return false;

  const nextWidth = getTableCellWidth(width);
  const rowCount = table.children.length;

  Editor.withoutNormalizing(editor, () => {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const cell = table.children[rowIndex]?.children[columnIndex];
      if (!cell) continue;

      Transforms.setNodes(editor, { width: nextWidth } as unknown as Partial<SlateElement>, {
        at: [...tablePath, rowIndex, columnIndex],
      });
    }
  });

  return true;
}

export function resizeTableRow(editor: Editor, tablePath: Path, rowIndex: number, height: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table?.children[rowIndex]) return false;

  Transforms.setNodes(
    editor,
    { height: getTableRowHeight(height) } as unknown as Partial<SlateElement>,
    { at: [...tablePath, rowIndex] },
  );

  return true;
}

export function removeTableRow(editor: Editor, tablePath: Path, rowIndex: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table) return false;

  const rowCount = table.children.length;
  if (rowCount <= 1) return false;
  if (rowIndex < 0 || rowIndex >= rowCount) return false;

  Transforms.removeNodes(editor, { at: [...tablePath, rowIndex] });

  const nextRowIndex = Math.min(rowIndex, rowCount - 2);
  Transforms.select(editor, Editor.start(editor, [...tablePath, nextRowIndex, 0]));
  return true;
}

export function removeTableColumn(editor: Editor, tablePath: Path, columnIndex: number) {
  const table = getTableAtPath(editor, tablePath);
  if (!table) return false;

  const rowCount = table.children.length;
  const columnCount = getTableColumnCount(table);
  if (columnCount <= 1) return false;
  if (columnIndex < 0 || columnIndex >= columnCount) return false;

  Editor.withoutNormalizing(editor, () => {
    for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
      Transforms.removeNodes(editor, { at: [...tablePath, rowIndex, columnIndex] });
    }
  });

  if (rowCount > 0) {
    const nextColumnIndex = Math.min(columnIndex, columnCount - 2);
    Transforms.select(editor, Editor.start(editor, [...tablePath, 0, nextColumnIndex]));
  }

  return true;
}

export function removeTableBlock(editor: Editor, tablePath: Path) {
  Transforms.removeNodes(editor, { at: tablePath });

  if (editor.children.length > 0) return;

  Transforms.insertNodes(editor, createEmptyParagraph(), { at: [0], select: true });
}

export function getTableColumnCount(table: TableBlockElement) {
  const firstRow = table.children[0];
  if (!firstRow) return DEFAULT_TABLE_COLUMNS;
  return Math.max(1, firstRow.children.length);
}

export function getTableColumnWidths(table: TableBlockElement) {
  const columnCount = getTableColumnCount(table);
  const firstRow = table.children[0];

  return Array.from({ length: columnCount }, (_, index) =>
    getTableCellWidth(firstRow?.children[index]?.width),
  );
}

export function getTableRowHeights(table: TableBlockElement) {
  return table.children.map((row) => {
    const tableRow = row as TableRowElement;
    return getTableRowHeight(tableRow.height);
  });
}

export function getTableCellWidth(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_TABLE_COLUMN_WIDTH;
  return Math.min(MAX_TABLE_COLUMN_WIDTH, Math.max(MIN_TABLE_COLUMN_WIDTH, value));
}

export function getTableRowHeight(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_TABLE_ROW_HEIGHT;
  return Math.min(MAX_TABLE_ROW_HEIGHT, Math.max(MIN_TABLE_ROW_HEIGHT, value));
}

export function getCurrentTableCellPosition(editor: Editor, tablePath: Path) {
  if (!editor.selection) return null;

  const [entry] = Editor.nodes(editor, {
    at: editor.selection,
    match: (node) => isTableCellElement(node),
    mode: "lowest",
  });

  if (!entry) return null;

  const [, cellPath] = entry;
  if (!isPathWithin(cellPath, tablePath)) return null;
  if (cellPath.length < tablePath.length + 2) return null;

  return {
    rowIndex: cellPath[tablePath.length],
    columnIndex: cellPath[tablePath.length + 1],
  };
}

export function handleEnterInTable(editor: Editor) {
  if (!editor.selection) return false;

  const [cellEntry] = Editor.nodes(editor, {
    at: editor.selection,
    match: (node) => isTableCellElement(node),
    mode: "lowest",
  });

  if (!cellEntry) return false;

  // Keep Enter behavior inside the current table cell: insert a new line/paragraph in-place.
  // This avoids jumping to other cells or leaving the table block.
  Editor.insertBreak(editor);
  return true;
}

function getTableAtPath(editor: Editor, tablePath: Path) {
  try {
    const node = Node.get(editor, tablePath);
    if (!isTableBlockElement(node)) return null;
    return node;
  } catch {
    return null;
  }
}

function createTableBlockElement(rowCount: number, columnCount: number): TableBlockElement {
  return {
    type: TABLE_BLOCK_TYPE,
    pluginScope: PLUGIN_SCOPE_BLOCK,
    pluginKind: TABLE_BLOCK_TYPE,
    children: Array.from({ length: rowCount }, () => createTableRowElement(columnCount)),
  } as unknown as TableBlockElement;
}

function createTableRowElement(
  columnCount: number,
  columnWidths?: number[],
  rowHeight: number = DEFAULT_TABLE_ROW_HEIGHT,
): TableRowElement {
  return {
    type: TABLE_ROW_TYPE,
    height: getTableRowHeight(rowHeight),
    children: Array.from({ length: columnCount }, (_, columnIndex) =>
      createTableCellElement(columnWidths?.[columnIndex] ?? DEFAULT_TABLE_COLUMN_WIDTH),
    ),
  } as unknown as TableRowElement;
}

function createTableCellElement(width: number): TableCellElement {
  return {
    type: TABLE_CELL_TYPE,
    width: getTableCellWidth(width),
    children: [createEmptyParagraph() as unknown as Descendant],
  } as unknown as TableCellElement;
}

function createEmptyParagraph() {
  return {
    type: "paragraph",
    children: [{ text: "" }],
  };
}

function clampIndex(value: number | undefined, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return max;
  if (max < 0) return -1;
  return Math.max(-1, Math.min(max, value));
}

function isPathWithin(path: Path, parentPath: Path) {
  if (path.length < parentPath.length) return false;
  for (let i = 0; i < parentPath.length; i += 1) {
    if (path[i] !== parentPath[i]) return false;
  }
  return true;
}

function hasTableAncestor(editor: Editor, path: Path) {
  if (path.length <= 1) return false;

  for (let i = path.length - 1; i >= 1; i -= 1) {
    const ancestorPath = path.slice(0, i);
    const [ancestorNode] = Editor.node(editor, ancestorPath) as NodeEntry;
    if (isTableBlockElement(ancestorNode)) return true;
  }

  return false;
}
