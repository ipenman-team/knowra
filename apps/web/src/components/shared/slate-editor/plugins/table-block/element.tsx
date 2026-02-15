"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Editor, Path, Transforms, type Range } from "slate";
import {
  ReactEditor,
  useFocused,
  useSelected,
  useSlate,
  useSlateStatic,
  type RenderElementProps,
} from "slate-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { BlockElementHandleMenu } from "../block-element-handle-menu";
import { findElementPathSafe } from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK } from "../types";
import {
  TABLE_BLOCK_TYPE,
  getTableCellWidth,
  getTableColumnWidths,
  getTableRowHeight,
  getTableRowHeights,
  insertTableColumn,
  insertTableRow,
  isTableCellElement,
  removeTableBlock,
  removeTableColumn,
  removeTableRow,
  resizeTableColumn,
  resizeTableRow,
  type TableBlockElement,
  type TableCellElement,
  type TableRowElement,
} from "./logic";

type TableBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

type DragState =
  | { kind: "column"; index: number; startPointer: number; startSize: number }
  | { kind: "row"; index: number; startPointer: number; startSize: number };

type TableBlockContextValue = {
  columnCount: number;
  rowCount: number;
  readOnly: boolean;
  startColumnResize: (columnIndex: number, event: ReactMouseEvent<HTMLButtonElement>) => void;
  startRowResize: (rowIndex: number, event: ReactMouseEvent<HTMLButtonElement>) => void;
  insertColumnAfter: (columnIndex: number) => void;
  insertRowAfter: (rowIndex: number) => void;
  removeColumnAt: (columnIndex: number) => void;
  removeRowAt: (rowIndex: number) => void;
};

const TableBlockContext = createContext<TableBlockContextValue | null>(null);

export function TableBlockElementView(props: TableBlockElementViewProps) {
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const element = props.element as TableBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);
  const isActive = selected && focused;

  const [dragState, setDragState] = useState<DragState | null>(null);

  const columnWidths = getTableColumnWidths(element);
  const rowHeights = getTableRowHeights(element);
  const columnCount = columnWidths.length;
  const rowCount = rowHeights.length;
  const tableWidth = Math.max(1, columnWidths.reduce((sum, width) => sum + width, 0));

  const getTablePath = useCallback(() => {
    return findElementPathSafe(editor, element);
  }, [editor, element]);

  const onDelete = useCallback(() => {
    if (readOnly) return;
    const tablePath = getTablePath();
    if (!tablePath) return;
    removeTableBlock(editor, tablePath);
  }, [editor, getTablePath, readOnly]);

  const insertColumnAfter = useCallback(
    (columnIndex: number) => {
      if (readOnly || columnIndex < 0 || columnIndex >= columnCount) return;
      const tablePath = getTablePath();
      if (!tablePath) return;
      insertTableColumn(editor, tablePath, columnIndex);
    },
    [columnCount, editor, getTablePath, readOnly],
  );

  const insertRowAfter = useCallback(
    (rowIndex: number) => {
      if (readOnly || rowIndex < 0 || rowIndex >= rowCount) return;
      const tablePath = getTablePath();
      if (!tablePath) return;
      insertTableRow(editor, tablePath, rowIndex);
    },
    [editor, getTablePath, readOnly, rowCount],
  );

  const removeColumnAt = useCallback(
    (columnIndex: number) => {
      if (readOnly || columnIndex < 0 || columnIndex >= columnCount) return;
      const tablePath = getTablePath();
      if (!tablePath) return;
      removeTableColumn(editor, tablePath, columnIndex);
    },
    [columnCount, editor, getTablePath, readOnly],
  );

  const removeRowAt = useCallback(
    (rowIndex: number) => {
      if (readOnly || rowIndex < 0 || rowIndex >= rowCount) return;
      const tablePath = getTablePath();
      if (!tablePath) return;
      removeTableRow(editor, tablePath, rowIndex);
    },
    [editor, getTablePath, readOnly, rowCount],
  );

  const startColumnResize = useCallback(
    (columnIndex: number, event: ReactMouseEvent<HTMLButtonElement>) => {
      if (readOnly) return;

      event.preventDefault();
      event.stopPropagation();

      setDragState({
        kind: "column",
        index: columnIndex,
        startPointer: event.clientX,
        startSize: columnWidths[columnIndex] ?? getTableCellWidth(undefined),
      });
    },
    [columnWidths, readOnly],
  );

  const startRowResize = useCallback(
    (rowIndex: number, event: ReactMouseEvent<HTMLButtonElement>) => {
      if (readOnly) return;

      event.preventDefault();
      event.stopPropagation();

      setDragState({
        kind: "row",
        index: rowIndex,
        startPointer: event.clientY,
        startSize: rowHeights[rowIndex] ?? getTableRowHeight(undefined),
      });
    },
    [readOnly, rowHeights],
  );

  useEffect(() => {
    if (!dragState) return;

    const onMouseMove = (event: MouseEvent) => {
      const tablePath = getTablePath();
      if (!tablePath) return;

      if (dragState.kind === "column") {
        const delta = event.clientX - dragState.startPointer;
        resizeTableColumn(editor, tablePath, dragState.index, dragState.startSize + delta);
        return;
      }

      const delta = event.clientY - dragState.startPointer;
      resizeTableRow(editor, tablePath, dragState.index, dragState.startSize + delta);
    };

    const onMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragState, editor, getTablePath]);

  const contextValue = useMemo<TableBlockContextValue>(() => {
    return {
      columnCount,
      rowCount,
      readOnly,
      startColumnResize,
      startRowResize,
      insertColumnAfter,
      insertRowAfter,
      removeColumnAt,
      removeRowAt,
    };
  }, [
    columnCount,
    rowCount,
    readOnly,
    startColumnResize,
    startRowResize,
    insertColumnAfter,
    insertRowAfter,
    removeColumnAt,
    removeRowAt,
  ]);

  return (
    <div
      {...props.attributes}
      data-plugin-scope={element.pluginScope ?? PLUGIN_SCOPE_BLOCK}
      data-plugin-kind={element.pluginKind ?? TABLE_BLOCK_TYPE}
      className="group/block relative my-2"
    >
      <BlockElementHandleMenu
        active={isActive}
        onDelete={onDelete}
        deleteDisabled={readOnly}
        deleteLabel="删除表格"
      />

      <div className="bg-background transition-colors">
        <div className="h-auto">
          <div className="h-full overflow-auto p-0">
            <TableBlockContext.Provider value={contextValue}>
              <div
                className="relative w-fit border-input bg-background shadow-sm transition-colors"
              >
                <table
                  className={cn(
                    "table-fixed border-collapse text-sm",
                    "[&_tbody_tr_td]:border [&_tbody_tr_td]:border-border [&_tbody_tr_td]:align-top",
                  )}
                  style={{ width: `${tableWidth}px` }}
                >
                  <tbody>{props.children}</tbody>
                </table>
              </div>
            </TableBlockContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowElementView(props: RenderElementProps) {
  const element = props.element as TableRowElement;
  const height = getTableRowHeight(element.height);

  return (
    <TableRow
      {...props.attributes}
      className="h-auto border-none hover:bg-transparent data-[state=selected]:bg-transparent"
      style={{ height: `${height}px` }}
    >
      {props.children}
    </TableRow>
  );
}

export function TableCellElementView(props: RenderElementProps) {
  const editor = useSlate();
  const focused = useFocused();
  const context = useContext(TableBlockContext);
  const element = props.element as TableCellElement;
  const width = getTableCellWidth(element.width);
  const cellPath = findElementPathSafe(editor, element);
  const selectionRef = useRef<Range | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const rowIndex = cellPath ? cellPath[cellPath.length - 2] : -1;
  const columnIndex = cellPath ? cellPath[cellPath.length - 1] : -1;

  const selectedCellPath = (() => {
    if (!editor.selection) return null;
    const [entry] = Editor.nodes(editor, {
      at: editor.selection,
      match: (node) => isTableCellElement(node),
      mode: "lowest",
    });
    if (!entry) return null;
    return entry[1];
  })();

  const isCurrentCell = Boolean(
    context &&
      !context.readOnly &&
      cellPath &&
      selectedCellPath &&
      Path.equals(cellPath, selectedCellPath),
  );
  const shouldShowCellMenu = isCurrentCell || menuOpen;

  const cacheSelection = useCallback(() => {
    selectionRef.current = editor.selection;
  }, [editor]);

  const restoreSelection = useCallback(() => {
    if (!selectionRef.current) return;
    try {
      Transforms.select(editor, selectionRef.current);
    } catch {
      // ignore invalid selection
    }
  }, [editor]);

  const canResizeColumn = Boolean(
    context &&
      !context.readOnly &&
      columnIndex >= 0 &&
      columnIndex < context.columnCount - 1,
  );
  const canResizeRow = Boolean(
    context &&
      !context.readOnly &&
      columnIndex === 0 &&
      rowIndex >= 0 &&
      rowIndex < context.rowCount - 1,
  );

  return (
    <TableCell
      {...props.attributes}
      className={cn(
        "group/table-cell relative border border-border p-1.5 align-top",
        isCurrentCell && focused && "bg-blue-500/5",
      )}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
    >
      {isCurrentCell && focused ? (
        <span
          contentEditable={false}
          className="pointer-events-none absolute inset-0 z-10 border-2 border-blue-400"
        />
      ) : null}

      {shouldShowCellMenu && context ? (
        <DropdownMenu
          modal={false}
          open={menuOpen}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              cacheSelection();
              restoreSelection();
            }
            setMenuOpen(nextOpen);
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              contentEditable={false}
              className="absolute right-1 top-1 z-30 inline-flex h-5 w-5 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-500"
              onPointerDown={(event) => {
                cacheSelection();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              aria-label="打开表格菜单"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44"
            sideOffset={6}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreSelection();
              ReactEditor.focus(editor as ReactEditor);
            }}
          >
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                context.insertColumnAfter(columnIndex);
              }}
            >
              <Plus className="h-4 w-4" />
              在右侧添加列
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                context.insertRowAfter(rowIndex);
              }}
            >
              <Plus className="h-4 w-4" />
              在下方添加行
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={context.columnCount <= 1}
              onSelect={(event) => {
                event.preventDefault();
                context.removeColumnAt(columnIndex);
              }}
            >
              <Trash2 className="h-4 w-4" />
              删除列
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={context.rowCount <= 1}
              onSelect={(event) => {
                event.preventDefault();
                context.removeRowAt(rowIndex);
              }}
            >
              <Trash2 className="h-4 w-4" />
              删除行
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {canResizeColumn ? (
        <button
          type="button"
          contentEditable={false}
          className={cn(
            "absolute -right-1.5 top-0 z-20 h-full w-3 cursor-col-resize bg-transparent opacity-0 transition-opacity",
            "group-hover/table-cell:opacity-100 hover:opacity-100",
            "before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-blue-500/75",
          )}
          onMouseDown={(event) => context?.startColumnResize(columnIndex, event)}
          aria-label="拖拽调整列宽"
        />
      ) : null}

      {canResizeRow ? (
        <button
          type="button"
          contentEditable={false}
          className="absolute -bottom-1 left-0 z-20 h-2 w-full cursor-row-resize bg-transparent transition-colors hover:bg-blue-500/35"
          onMouseDown={(event) => context?.startRowResize(rowIndex, event)}
          aria-label="拖拽调整行高"
        />
      ) : null}

      <div className="min-h-[20px]">{props.children}</div>
    </TableCell>
  );
}
