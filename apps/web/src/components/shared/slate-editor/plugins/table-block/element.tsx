"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Columns3, Expand, Minimize2, Rows3, Trash2 } from "lucide-react";
import { useFocused, useSelected, useSlateStatic, type RenderElementProps } from "slate-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { findElementPathSafe } from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK } from "../types";
import {
  TABLE_BLOCK_TYPE,
  getCurrentTableCellPosition,
  getTableCellWidth,
  getTableColumnWidths,
  getTableRowHeight,
  getTableRowHeights,
  insertTableColumn,
  insertTableRow,
  removeTableBlock,
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
};

const TableBlockContext = createContext<TableBlockContextValue | null>(null);

export function TableBlockElementView(props: TableBlockElementViewProps) {
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const element = props.element as TableBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);
  const isActive = selected && focused;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const columnWidths = getTableColumnWidths(element);
  const rowHeights = getTableRowHeights(element);
  const columnCount = columnWidths.length;
  const rowCount = rowHeights.length;
  const tableWidth = Math.max(720, columnWidths.reduce((sum, width) => sum + width, 0));

  const getTablePath = useCallback(() => {
    return findElementPathSafe(editor, element);
  }, [editor, element]);

  const onAddRow = useCallback(() => {
    if (readOnly) return;
    const tablePath = getTablePath();
    if (!tablePath) return;

    const position = getCurrentTableCellPosition(editor, tablePath);
    insertTableRow(editor, tablePath, position?.rowIndex ?? rowCount - 1);
  }, [editor, getTablePath, readOnly, rowCount]);

  const onAddColumn = useCallback(() => {
    if (readOnly) return;
    const tablePath = getTablePath();
    if (!tablePath) return;

    const position = getCurrentTableCellPosition(editor, tablePath);
    insertTableColumn(editor, tablePath, position?.columnIndex ?? columnCount - 1);
  }, [columnCount, editor, getTablePath, readOnly]);

  const onDelete = useCallback(() => {
    if (readOnly) return;
    const tablePath = getTablePath();
    if (!tablePath) return;
    removeTableBlock(editor, tablePath);
  }, [editor, getTablePath, readOnly]);

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
    };
  }, [columnCount, readOnly, rowCount, startColumnResize, startRowResize]);

  return (
    <div
      {...props.attributes}
      data-plugin-scope={element.pluginScope ?? PLUGIN_SCOPE_BLOCK}
      data-plugin-kind={element.pluginKind ?? TABLE_BLOCK_TYPE}
      className={cn("my-2", isFullscreen && "relative z-50")}
    >
      <div
        className={cn(
          "overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors",
          "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/60",
          isActive && "border-blue-500 ring-1 ring-blue-500/60",
          isFullscreen && "fixed inset-0 rounded-none border-none shadow-none",
        )}
      >
        <div contentEditable={false} className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <span className="mr-2 text-sm font-medium">表格</span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={readOnly}
            onClick={onAddRow}
          >
            <Rows3 className="h-4 w-4" />
            插入行
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={readOnly}
            onClick={onAddColumn}
          >
            <Columns3 className="h-4 w-4" />
            插入列
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 px-2"
            onClick={() => {
              setIsFullscreen((prev) => !prev);
            }}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            {isFullscreen ? "退出全屏" : "全屏编辑"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={readOnly}
            onClick={onDelete}
            aria-label="删除表格"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className={cn("bg-background", isFullscreen ? "h-[calc(100dvh-49px)]" : "h-auto")}>
          <div className="h-full overflow-auto p-2">
            <TableBlockContext.Provider value={contextValue}>
              <div className="min-w-full w-fit">
                <Table
                  className={cn(
                    "table-fixed border-collapse",
                    "[&_tbody_tr_td]:border [&_tbody_tr_td]:border-border [&_tbody_tr_td]:align-top",
                  )}
                  style={{ width: `${tableWidth}px` }}
                >
                  <TableBody>{props.children}</TableBody>
                </Table>
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
  const editor = useSlateStatic();
  const context = useContext(TableBlockContext);
  const element = props.element as TableCellElement;
  const width = getTableCellWidth(element.width);
  const cellPath = findElementPathSafe(editor, element);

  const rowIndex = cellPath ? cellPath[cellPath.length - 2] : -1;
  const columnIndex = cellPath ? cellPath[cellPath.length - 1] : -1;
  const canResizeColumn = Boolean(
    context &&
      !context.readOnly &&
      rowIndex === 0 &&
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
      className="relative border border-border p-2 align-top"
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
    >
      {canResizeColumn ? (
        <button
          type="button"
          contentEditable={false}
          className="absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize bg-transparent transition-colors hover:bg-blue-500/35"
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

      <div className="min-h-[38px]">{props.children}</div>
    </TableCell>
  );
}
