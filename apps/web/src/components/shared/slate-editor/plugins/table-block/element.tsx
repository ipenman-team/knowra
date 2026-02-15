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
import { Columns3, Expand, Minimize2, Plus, Rows3, Trash2 } from "lucide-react";
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
  removeTableColumn,
  removeTableBlock,
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
  selectedColumnIndex: number | null;
  selectedRowIndex: number | null;
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
  const [hoverColumnBoundary, setHoverColumnBoundary] = useState<number | null>(null);
  const [hoverRowBoundary, setHoverRowBoundary] = useState<number | null>(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const columnWidths = getTableColumnWidths(element);
  const rowHeights = getTableRowHeights(element);
  const columnCount = columnWidths.length;
  const rowCount = rowHeights.length;
  const tableWidth = Math.max(720, columnWidths.reduce((sum, width) => sum + width, 0));
  const tableHeight = Math.max(1, rowHeights.reduce((sum, height) => sum + height, 0));

  const columnBoundaries = useMemo(() => {
    let offset = 0;
    const boundaries = [0];
    for (const width of columnWidths) {
      offset += width;
      boundaries.push(offset);
    }
    return boundaries;
  }, [columnWidths]);

  const rowBoundaries = useMemo(() => {
    let offset = 0;
    const boundaries = [0];
    for (const height of rowHeights) {
      offset += height;
      boundaries.push(offset);
    }
    return boundaries;
  }, [rowHeights]);

  const columnOffsets = useMemo(() => columnBoundaries.slice(0, -1), [columnBoundaries]);
  const rowOffsets = useMemo(() => rowBoundaries.slice(0, -1), [rowBoundaries]);

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

  const onInsertColumnAtBoundary = useCallback(
    (boundaryIndex: number) => {
      if (readOnly) return;
      const tablePath = getTablePath();
      if (!tablePath) return;

      setHoverColumnBoundary(null);
      insertTableColumn(editor, tablePath, boundaryIndex - 1);
    },
    [editor, getTablePath, readOnly],
  );

  const onInsertRowAtBoundary = useCallback(
    (boundaryIndex: number) => {
      if (readOnly) return;
      const tablePath = getTablePath();
      if (!tablePath) return;

      setHoverRowBoundary(null);
      insertTableRow(editor, tablePath, boundaryIndex - 1);
    },
    [editor, getTablePath, readOnly],
  );

  const onDelete = useCallback(() => {
    if (readOnly) return;
    const tablePath = getTablePath();
    if (!tablePath) return;
    removeTableBlock(editor, tablePath);
  }, [editor, getTablePath, readOnly]);

  const onDeleteSelectedColumn = useCallback(() => {
    if (
      readOnly ||
      selectedColumnIndex === null ||
      selectedColumnIndex < 0 ||
      selectedColumnIndex >= columnCount
    ) {
      return;
    }
    const tablePath = getTablePath();
    if (!tablePath) return;

    if (removeTableColumn(editor, tablePath, selectedColumnIndex)) {
      setSelectedColumnIndex(null);
    }
  }, [columnCount, editor, getTablePath, readOnly, selectedColumnIndex]);

  const onDeleteSelectedRow = useCallback(() => {
    if (readOnly || selectedRowIndex === null || selectedRowIndex < 0 || selectedRowIndex >= rowCount) {
      return;
    }
    const tablePath = getTablePath();
    if (!tablePath) return;

    if (removeTableRow(editor, tablePath, selectedRowIndex)) {
      setSelectedRowIndex(null);
    }
  }, [editor, getTablePath, readOnly, rowCount, selectedRowIndex]);

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

  const effectiveSelectedColumnIndex =
    selectedColumnIndex !== null && selectedColumnIndex >= 0 && selectedColumnIndex < columnCount
      ? selectedColumnIndex
      : null;
  const effectiveSelectedRowIndex =
    selectedRowIndex !== null && selectedRowIndex >= 0 && selectedRowIndex < rowCount
      ? selectedRowIndex
      : null;

  const contextValue = useMemo<TableBlockContextValue>(() => {
    return {
      columnCount,
      rowCount,
      readOnly,
      selectedColumnIndex: effectiveSelectedColumnIndex,
      selectedRowIndex: effectiveSelectedRowIndex,
      startColumnResize,
      startRowResize,
    };
  }, [
    columnCount,
    effectiveSelectedColumnIndex,
    effectiveSelectedRowIndex,
    readOnly,
    rowCount,
    startColumnResize,
    startRowResize,
  ]);

  const selectedColumnLeft =
    effectiveSelectedColumnIndex === null ? null : (columnOffsets[effectiveSelectedColumnIndex] ?? 0);
  const selectedColumnWidth =
    effectiveSelectedColumnIndex === null ? null : (columnWidths[effectiveSelectedColumnIndex] ?? 0);
  const selectedRowTop = effectiveSelectedRowIndex === null ? null : (rowOffsets[effectiveSelectedRowIndex] ?? 0);
  const selectedRowHeight =
    effectiveSelectedRowIndex === null ? null : (rowHeights[effectiveSelectedRowIndex] ?? 0);

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
              <div className="min-w-full w-fit pl-4 pt-4">
                <div className="relative" style={{ width: `${tableWidth}px`, minHeight: `${tableHeight}px` }}>
                  <Table
                    className={cn(
                      "table-fixed border-collapse",
                      "[&_tbody_tr_td]:border [&_tbody_tr_td]:border-border [&_tbody_tr_td]:align-top",
                    )}
                    style={{ width: `${tableWidth}px` }}
                  >
                    <TableBody>{props.children}</TableBody>
                  </Table>

                  {!readOnly ? (
                    <div contentEditable={false} className="pointer-events-none absolute inset-0 z-30">
                      {selectedColumnLeft !== null && selectedColumnWidth !== null ? (
                        <div
                          className="absolute inset-y-0 border border-blue-500/60 bg-blue-500/5"
                          style={{ left: `${selectedColumnLeft}px`, width: `${selectedColumnWidth}px` }}
                        />
                      ) : null}

                      {selectedRowTop !== null && selectedRowHeight !== null ? (
                        <div
                          className="absolute inset-x-0 border border-blue-500/60 bg-blue-500/5"
                          style={{ top: `${selectedRowTop}px`, height: `${selectedRowHeight}px` }}
                        />
                      ) : null}

                      {hoverColumnBoundary !== null ? (
                        <div
                          className="absolute top-0 h-full w-px bg-blue-500/85"
                          style={{ left: `${columnBoundaries[hoverColumnBoundary] ?? 0}px` }}
                        />
                      ) : null}

                      {hoverRowBoundary !== null ? (
                        <div
                          className="absolute left-0 w-full h-px bg-blue-500/85"
                          style={{ top: `${rowBoundaries[hoverRowBoundary] ?? 0}px` }}
                        />
                      ) : null}

                      <div className="absolute -top-7 left-0 z-40 flex h-5 w-full">
                        {columnWidths.map((width, columnIndex) => (
                          <button
                            key={`column-control-${columnIndex}`}
                            type="button"
                            contentEditable={false}
                            className={cn(
                              "pointer-events-auto h-full border border-border/70 bg-background/80 transition-colors",
                              effectiveSelectedColumnIndex === columnIndex
                                ? "border-blue-500 bg-blue-100"
                                : "hover:bg-blue-50",
                            )}
                            style={{ width: `${width}px` }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedColumnIndex(columnIndex);
                              setSelectedRowIndex(null);
                            }}
                            aria-label={`选中第 ${columnIndex + 1} 列`}
                            title="选中整列"
                          />
                        ))}
                      </div>

                      <div className="absolute -left-7 top-0 z-40 flex w-5 flex-col">
                        {rowHeights.map((height, rowIndex) => (
                          <button
                            key={`row-control-${rowIndex}`}
                            type="button"
                            contentEditable={false}
                            className={cn(
                              "pointer-events-auto w-full border border-border/70 bg-background/80 transition-colors",
                              effectiveSelectedRowIndex === rowIndex
                                ? "border-blue-500 bg-blue-100"
                                : "hover:bg-blue-50",
                            )}
                            style={{ height: `${height}px` }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedRowIndex(rowIndex);
                              setSelectedColumnIndex(null);
                            }}
                            aria-label={`选中第 ${rowIndex + 1} 行`}
                            title="选中整行"
                          />
                        ))}
                      </div>

                      {columnBoundaries.map((offset, boundaryIndex) => (
                        <button
                          key={`column-boundary-${boundaryIndex}`}
                          type="button"
                          contentEditable={false}
                          className={cn(
                            "pointer-events-auto absolute z-40 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-md border text-[10px] transition-all",
                            hoverColumnBoundary === boundaryIndex
                              ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                              : "border-transparent bg-transparent text-transparent",
                          )}
                          style={{ top: "-10px", left: `${offset}px` }}
                          onMouseEnter={() => setHoverColumnBoundary(boundaryIndex)}
                          onMouseLeave={() => setHoverColumnBoundary((prev) => (prev === boundaryIndex ? null : prev))}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onInsertColumnAtBoundary(boundaryIndex);
                          }}
                          aria-label="插入列"
                          title="插入列"
                        >
                          {hoverColumnBoundary === boundaryIndex ? (
                            <Plus className="h-3 w-3" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          )}
                        </button>
                      ))}

                      {rowBoundaries.map((offset, boundaryIndex) => (
                        <button
                          key={`row-boundary-${boundaryIndex}`}
                          type="button"
                          contentEditable={false}
                          className={cn(
                            "pointer-events-auto absolute z-40 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md border text-[10px] transition-all",
                            hoverRowBoundary === boundaryIndex
                              ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                              : "border-transparent bg-transparent text-transparent",
                          )}
                          style={{ top: `${offset}px`, left: "-10px" }}
                          onMouseEnter={() => setHoverRowBoundary(boundaryIndex)}
                          onMouseLeave={() => setHoverRowBoundary((prev) => (prev === boundaryIndex ? null : prev))}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onInsertRowAtBoundary(boundaryIndex);
                          }}
                          aria-label="插入行"
                          title="插入行"
                        >
                          {hoverRowBoundary === boundaryIndex ? (
                            <Plus className="h-3 w-3" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          )}
                        </button>
                      ))}

                      {selectedColumnLeft !== null && selectedColumnWidth !== null ? (
                        <div
                          className="pointer-events-auto absolute -top-14 z-50 -translate-x-1/2 rounded-md border bg-background p-1 shadow-md"
                          style={{ left: `${selectedColumnLeft + selectedColumnWidth / 2}px` }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                            disabled={columnCount <= 1}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onDeleteSelectedColumn();
                            }}
                          >
                            删除列
                          </Button>
                        </div>
                      ) : null}

                      {selectedRowTop !== null && selectedRowHeight !== null ? (
                        <div
                          className="pointer-events-auto absolute -left-24 z-50 -translate-y-1/2 rounded-md border bg-background p-1 shadow-md"
                          style={{ top: `${selectedRowTop + selectedRowHeight / 2}px` }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                            disabled={rowCount <= 1}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onDeleteSelectedRow();
                            }}
                          >
                            删除行
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
  const isColumnSelected = Boolean(
    context && context.selectedColumnIndex !== null && context.selectedColumnIndex === columnIndex,
  );
  const isRowSelected = Boolean(
    context && context.selectedRowIndex !== null && context.selectedRowIndex === rowIndex,
  );

  return (
    <TableCell
      {...props.attributes}
      className={cn(
        "group/table-cell relative border border-border p-2 align-top",
        (isColumnSelected || isRowSelected) && "bg-blue-500/5",
      )}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
    >
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

      <div className="min-h-[38px]">{props.children}</div>
    </TableCell>
  );
}
