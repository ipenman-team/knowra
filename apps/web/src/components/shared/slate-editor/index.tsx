"use client";

import { Code2, Heading1, Heading2, List, ListOrdered, Quote, Table2, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createEditor, Descendant, Editor, Element as SlateElement, Range as SlateRange, Transforms } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  ReactEditor,
  Slate,
  withReact,
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from "slate-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  canIndentListItem,
  handleEnterInList,
  indentListItem,
  isInListItem,
  outdentListItem,
} from "./list-commands";
import { isBlockActive, toggleBlock, toggleMark } from "./editor-format";
import { insertParagraphAfterSelectedBlockPlugin } from "./plugins/block-plugin-utils";
import { setBlockAlign } from "./plugins/align/logic";
import { CodeBlockElementView } from "./plugins/code-block/element";
import { CODE_BLOCK_TYPE, insertCodeBlock, withCodeBlock } from "./plugins/code-block/logic";
import { DiagramBlockElementView } from "./plugins/diagram-block/element";
import {
  DIAGRAM_BLOCK_TYPE,
  insertDiagramBlock,
  withDiagramBlock,
} from "./plugins/diagram-block/logic";
import { EditorToolbar } from "./plugins/editor-toolbar";
import {
  DEFAULT_FONT_SIZE,
  normalizeFontSize,
} from "./plugins/font-size/logic";
import { ImageBlockElementView } from "./plugins/image-block/element";
import {
  getFirstImageFileFromClipboard,
  IMAGE_BLOCK_TYPE,
  insertImageBlock,
  withImageBlock,
} from "./plugins/image-block/logic";
import { uploadEditorImage } from "./plugins/image-block/upload";
import { LINK_MARK, normalizeLinkUrl } from "./plugins/link/logic";
import {
  handleEnterInTable,
  TABLE_BLOCK_TYPE,
  TABLE_CELL_TYPE,
  TABLE_ROW_TYPE,
  insertTableBlock,
  isSelectionInTable,
  withTableBlock,
} from "./plugins/table-block/logic";
import {
  TableBlockElementView,
  TableCellElementView,
  TableRowElementView,
} from "./plugins/table-block/element";
import { PLUGIN_SCOPE_INLINE } from "./plugins/types";

export type SlateValue = Descendant[];

const SLASH_MENU_WIDTH = 320;

type SlashMenuItem = {
  id: string;
  label: string;
  keywords: string[];
  icon: LucideIcon;
  execute: (editor: Editor) => boolean | void;
};

type SlashMenuState = {
  query: string;
  range: SlateRange;
  top: number;
  left: number;
};

export function parseContentToSlateValue(content: unknown): SlateValue {
  if (!content) {
    return [
      {
        type: "paragraph",
        children: [{ text: "" }],
      } as unknown as Descendant,
    ];
  }

  if (Array.isArray(content)) {
    if (content.length > 0) return content as SlateValue;
    return [
      {
        type: "paragraph",
        children: [{ text: "" }],
      } as unknown as Descendant,
    ];
  }

  try {
    if (typeof content !== "string") {
      return [
        {
          type: "paragraph",
          children: [{ text: "" }],
        } as unknown as Descendant,
      ];
    }

    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) return parsed as SlateValue;
      return [
        {
          type: "paragraph",
          children: [{ text: "" }],
        } as unknown as Descendant,
      ];
    }
  } catch {
    // ignore
  }

  return [
    {
      type: "paragraph",
      children: [{ text: String(content) }],
    } as unknown as Descendant,
  ];
}

export function serializeSlateValue(value: SlateValue): string {
  return JSON.stringify(value);
}

function Leaf(props: RenderLeafProps) {
  const { attributes, children, leaf } = props;
  const anyLeaf = leaf as unknown as {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    textColor?: string;
    backgroundColor?: string;
    link?: string;
    fontSize?: string;
    pluginScope?: string;
    pluginKind?: string;
  };

  let next = children;
  if (anyLeaf.bold) next = <strong>{next}</strong>;
  if (anyLeaf.italic) next = <em>{next}</em>;
  if (anyLeaf.underline) next = <u>{next}</u>;

  const linkUrl = normalizeLeafLink(anyLeaf.link);
  if (linkUrl) {
    next = (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer text-blue-500"
        data-plugin-scope={anyLeaf.pluginScope ?? PLUGIN_SCOPE_INLINE}
        data-plugin-kind={anyLeaf.pluginKind ?? LINK_MARK}
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          window.open(linkUrl, "_blank", "noopener,noreferrer");
        }}
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        {next}
      </a>
    );
  }

  const inlineStyle: CSSProperties = {};
  const textColor = normalizeLeafColor(anyLeaf.textColor);
  if (textColor) inlineStyle.color = textColor;

  const backgroundColor = normalizeLeafColor(anyLeaf.backgroundColor);
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;

  const fontSize = normalizeFontSize(anyLeaf.fontSize);
  if (fontSize && fontSize !== DEFAULT_FONT_SIZE) {
    inlineStyle.fontSize = fontSize;
    inlineStyle.lineHeight = 1.4;
  }

  return (
    <span {...attributes} style={inlineStyle}>
      {next}
    </span>
  );
}

function Element(props: RenderElementProps & { readOnly: boolean }) {
  const { attributes, children, element } = props;
  const el = element as SlateElement & { type?: string; align?: string };
  const alignStyle = getElementAlignStyle(el);

  switch (el.type) {
    case CODE_BLOCK_TYPE:
      return <CodeBlockElementView {...props} />;
    case DIAGRAM_BLOCK_TYPE:
      return <DiagramBlockElementView {...props} />;
    case IMAGE_BLOCK_TYPE:
      return <ImageBlockElementView {...props} />;
    case TABLE_BLOCK_TYPE:
      return <TableBlockElementView {...props} />;
    case TABLE_ROW_TYPE:
      return <TableRowElementView {...props} />;
    case TABLE_CELL_TYPE:
      return <TableCellElementView {...props} />;
    case "heading-one":
      return (
        <h1 {...attributes} className="py-1 text-3xl font-bold tracking-tight" style={alignStyle}>
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} className="py-1 text-2xl font-semibold tracking-tight" style={alignStyle}>
          {children}
        </h2>
      );
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          className="my-2 border-l-2 border-border pl-4 text-muted-foreground"
          style={alignStyle}
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul
          {...attributes}
          className="my-2 list-disc pl-6 [&_ul]:list-[circle] [&_ul_ul]:list-[square] [&_ul_ul_ul]:list-disc"
          style={alignStyle}
        >
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol
          {...attributes}
          className="my-2 list-decimal pl-6 [&_ol]:list-[lower-alpha] [&_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:list-decimal"
          style={alignStyle}
        >
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li {...attributes} style={alignStyle}>
          {children}
        </li>
      );
    default:
      return (
        <p {...attributes} className="py-1" style={alignStyle}>
          {children}
        </p>
      );
  }
}

function normalizeLeafColor(value?: string) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeLeafLink(value?: string) {
  if (typeof value !== "string") return null;
  return normalizeLinkUrl(value);
}

function getElementAlignStyle(element: SlateElement & { align?: string }): CSSProperties | undefined {
  const align = normalizeElementAlign(element.align);
  if (!align) return undefined;
  return { textAlign: align };
}

function normalizeElementAlign(value?: string): CSSProperties["textAlign"] | null {
  if (value === "left") return "left";
  if (value === "center") return "center";
  if (value === "right") return "right";
  if (value === "justify") return "justify";
  return null;
}

function getSlashTriggerState(editor: Editor): { query: string; range: SlateRange } | null {
  if (!editor.selection || !SlateRange.isCollapsed(editor.selection)) return null;
  if (isSelectionInTable(editor)) return null;

  const [blockEntry] = Editor.nodes(editor, {
    at: editor.selection,
    mode: "lowest",
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });
  if (!blockEntry) return null;

  const [blockNode, blockPath] = blockEntry;
  const blockType = (blockNode as SlateElement & { type?: string }).type ?? "paragraph";
  if (blockType !== "paragraph" && blockType !== "list-item") return null;

  const blockStart = Editor.start(editor, blockPath);
  const range: SlateRange = {
    anchor: blockStart,
    focus: editor.selection.anchor,
  };
  const textBeforeCaret = Editor.string(editor, range);
  if (!textBeforeCaret.startsWith("/")) return null;

  const query = textBeforeCaret.slice(1);
  if (query.includes(" ")) return null;

  return { query, range };
}

function getCaretViewportPosition(editableElement: HTMLElement | null) {
  if (typeof window === "undefined") return null;

  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return null;

  const domRange = domSelection.getRangeAt(0).cloneRange();
  domRange.collapse(true);

  const firstRect = domRange.getClientRects()[0];
  const rect = firstRect ?? domRange.getBoundingClientRect() ?? editableElement?.getBoundingClientRect();
  if (!rect) return null;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const left = Math.min(
    Math.max(12, rect.left),
    Math.max(12, viewportWidth - SLASH_MENU_WIDTH - 12),
  );

  return {
    top: Math.max(12, rect.bottom + 8),
    left,
  };
}

export function SlateEditor(props: {
  value: SlateValue;
  onChange: (value: SlateValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showToolbar?: boolean;
}) {
  const editor = useMemo(
    () =>
      withImageBlock(
        withDiagramBlock(withCodeBlock(withTableBlock(withHistory(withReact(createEditor()))))),
      ),
    [],
  );
  const showToolbar = props.showToolbar ?? true;
  const readOnly = Boolean(props.readOnly ?? false);
  const editorReadOnly = Boolean(props.disabled || readOnly);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const [slashMenuState, setSlashMenuState] = useState<SlashMenuState | null>(null);
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);

  const slashMenuItems = useMemo<SlashMenuItem[]>(() => {
    return [
      {
        id: "quote",
        label: "引用",
        keywords: ["quote", "blockquote", "yy"],
        icon: Quote,
        execute: (targetEditor) => {
          if (!isBlockActive(targetEditor, "block-quote")) {
            toggleBlock(targetEditor, "block-quote");
          }
          return true;
        },
      },
      {
        id: "table",
        label: "表格",
        keywords: ["table", "grid", "biaoge"],
        icon: Table2,
        execute: (targetEditor) => insertTableBlock(targetEditor),
      },
      {
        id: "code",
        label: "代码块",
        keywords: ["code", "daima", "snippet"],
        icon: Code2,
        execute: (targetEditor) => {
          insertCodeBlock(targetEditor);
          return true;
        },
      },
      {
        id: "diagram",
        label: "文本绘图",
        keywords: ["diagram", "mermaid", "tu"],
        icon: Code2,
        execute: (targetEditor) => {
          insertDiagramBlock(targetEditor);
          return true;
        },
      },
      {
        id: "heading-one",
        label: "一级标题",
        keywords: ["h1", "heading"],
        icon: Heading1,
        execute: (targetEditor) => {
          if (!isBlockActive(targetEditor, "heading-one")) {
            toggleBlock(targetEditor, "heading-one");
          }
          return true;
        },
      },
      {
        id: "heading-two",
        label: "二级标题",
        keywords: ["h2", "heading2"],
        icon: Heading2,
        execute: (targetEditor) => {
          if (!isBlockActive(targetEditor, "heading-two")) {
            toggleBlock(targetEditor, "heading-two");
          }
          return true;
        },
      },
      {
        id: "bulleted-list",
        label: "无序列表",
        keywords: ["bullet", "list", "ul"],
        icon: List,
        execute: (targetEditor) => {
          if (!isBlockActive(targetEditor, "bulleted-list")) {
            toggleBlock(targetEditor, "bulleted-list");
          }
          return true;
        },
      },
      {
        id: "numbered-list",
        label: "有序列表",
        keywords: ["number", "list", "ol"],
        icon: ListOrdered,
        execute: (targetEditor) => {
          if (!isBlockActive(targetEditor, "numbered-list")) {
            toggleBlock(targetEditor, "numbered-list");
          }
          return true;
        },
      },
    ];
  }, []);

  const filteredSlashMenuItems = useMemo(() => {
    if (!slashMenuState) return [] as SlashMenuItem[];

    const normalizedQuery = slashMenuState.query.trim().toLowerCase();
    if (!normalizedQuery) return slashMenuItems;

    return slashMenuItems.filter((item) => {
      if (item.label.toLowerCase().includes(normalizedQuery)) return true;
      return item.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));
    });
  }, [slashMenuItems, slashMenuState]);

  const syncSlashMenuState = useCallback(() => {
    if (editorReadOnly) {
      setSlashMenuState(null);
      return;
    }

    const trigger = getSlashTriggerState(editor);
    if (!trigger) {
      setSlashMenuState(null);
      return;
    }

    const position = getCaretViewportPosition(editableRef.current);
    if (!position) return;

    setSlashMenuState((prev) => {
      const nextState: SlashMenuState = {
        query: trigger.query,
        range: trigger.range,
        top: position.top,
        left: position.left,
      };

      if (!prev || prev.query !== nextState.query) {
        setSlashActiveIndex(0);
      }

      return nextState;
    });
  }, [editor, editorReadOnly]);

  const closeSlashMenu = useCallback(() => {
    setSlashMenuState(null);
    setSlashActiveIndex(0);
  }, []);

  const executeSlashMenuItem = useCallback(
    (item: SlashMenuItem) => {
      if (!slashMenuState) return;

      try {
        Transforms.select(editor, slashMenuState.range);
      } catch {
        closeSlashMenu();
        return;
      }

      Transforms.delete(editor);

      const result = item.execute(editor);
      if (result === false) {
        toast.error("当前位置无法插入该类型");
      }

      closeSlashMenu();
      ReactEditor.focus(editor);
    },
    [closeSlashMenu, editor, slashMenuState],
  );

  useEffect(() => {
    if (!slashMenuState) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && slashMenuRef.current?.contains(target)) return;
      closeSlashMenu();
    };

    const onViewportChange = () => {
      syncSlashMenuState();
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [closeSlashMenu, slashMenuState, syncSlashMenuState]);

  const renderLeaf = useCallback((leafProps: RenderLeafProps) => {
    return <Leaf {...leafProps} />;
  }, []);

  const renderElement = useCallback((elementProps: RenderElementProps) => {
    return <Element {...elementProps} readOnly={editorReadOnly} />;
  }, [editorReadOnly]);

  const renderPlaceholder = useCallback((placeholderProps: RenderPlaceholderProps) => {
    const { attributes, children } = placeholderProps;

    return (
      <span
        {...attributes}
        className="text-muted-foreground/40"
        style={{
          ...attributes.style,
          top: "0.75rem",
          left: "0.25rem",
        }}
      >
        {children}
      </span>
    );
  }, []);

  return (
    <Slate
      editor={editor}
      initialValue={props.value}
      onChange={(nextValue) => {
        props.onChange(nextValue);
        syncSlashMenuState();
      }}
    >
      {showToolbar ? <EditorToolbar disabled={props.disabled || readOnly} /> : null}
      <Editable
        ref={editableRef}
        className={cn(
          "min-h-[45vh] w-full rounded-md bg-background px-1 py-2 text-[15px] leading-7",
          "focus-visible:outline-none",
          props.disabled && "opacity-70",
          props.className,
        )}
        placeholder={props.placeholder}
        renderPlaceholder={renderPlaceholder}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        readOnly={editorReadOnly}
        onKeyDown={(e) => {
          if (slashMenuState) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (filteredSlashMenuItems.length > 0) {
                setSlashActiveIndex((prev) => (prev + 1) % filteredSlashMenuItems.length);
              }
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (filteredSlashMenuItems.length > 0) {
                setSlashActiveIndex((prev) =>
                  prev <= 0 ? filteredSlashMenuItems.length - 1 : prev - 1,
                );
              }
              return;
            }

            if (e.key === "Enter") {
              if (filteredSlashMenuItems.length === 0) return;
              e.preventDefault();
              const nextIndex = Math.min(slashActiveIndex, filteredSlashMenuItems.length - 1);
              executeSlashMenuItem(filteredSlashMenuItems[nextIndex] ?? filteredSlashMenuItems[0]);
              return;
            }

            if (e.key === "Escape") {
              e.preventDefault();
              closeSlashMenu();
              return;
            }
          }

          if (e.key === "Enter") {
            if (handleEnterInTable(editor)) {
              e.preventDefault();
              return;
            }

            if (insertParagraphAfterSelectedBlockPlugin(editor)) {
              e.preventDefault();
              return;
            }

            if (!handleEnterInList(editor)) return;
            e.preventDefault();
            return;
          }

          if (e.key === "Tab") {
            const canIndent = canIndentListItem(editor);
            if (!isInListItem(editor)) return;

            e.preventDefault();
            if (e.shiftKey) outdentListItem(editor);
            else if (canIndent) indentListItem(editor);
            return;
          }

          const isMod = e.metaKey || e.ctrlKey;
          if (!isMod) return;

          if (e.shiftKey) {
            const key = e.key.toLowerCase();

            if (key === "l") {
              e.preventDefault();
              setBlockAlign(editor, "left");
              return;
            }
            if (key === "c") {
              e.preventDefault();
              setBlockAlign(editor, "center");
              return;
            }
            if (key === "r") {
              e.preventDefault();
              setBlockAlign(editor, "right");
              return;
            }
            if (key === "j") {
              e.preventDefault();
              setBlockAlign(editor, "justify");
              return;
            }
          }

          if (e.key.toLowerCase() === "b") {
            e.preventDefault();
            toggleMark(editor, "bold");
          }
          if (e.key.toLowerCase() === "i") {
            e.preventDefault();
            toggleMark(editor, "italic");
          }
          if (e.key.toLowerCase() === "u") {
            e.preventDefault();
            toggleMark(editor, "underline");
          }
        }}
        onPaste={(event) => {
          if (editorReadOnly) return;

          const targetNode = event.target;
          const targetElement =
            targetNode instanceof HTMLElement
              ? targetNode
              : targetNode instanceof Node
                ? targetNode.parentElement
                : null;
          if (targetElement?.closest(".cm-editor")) return;

          const imageFile = getFirstImageFileFromClipboard(event.clipboardData);
          if (!imageFile) return;

          event.preventDefault();

          void uploadEditorImage(imageFile, "editor/image-paste")
            .then((url) => {
              insertImageBlock(editor, {
                url,
                alt: imageFile.name || "image",
              });
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "图片上传失败";
              toast.error(message || "图片上传失败");
            });
        }}
      />

      {!editorReadOnly && slashMenuState ? (
        <div
          ref={slashMenuRef}
          contentEditable={false}
          className="fixed z-50 w-[320px] overflow-hidden rounded-md border border-input bg-background p-1 shadow-xl"
          style={{
            top: `${slashMenuState.top}px`,
            left: `${slashMenuState.left}px`,
            width: `${SLASH_MENU_WIDTH}px`,
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <div className="px-3 py-1 text-xs text-muted-foreground">输入以搜索</div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filteredSlashMenuItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">无匹配项</div>
            ) : (
              filteredSlashMenuItems.map((item, index) => {
                const Icon = item.icon;
                const nextActiveIndex = Math.min(slashActiveIndex, filteredSlashMenuItems.length - 1);
                const isActive = index === nextActiveIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-blue-50 text-blue-600" : "hover:bg-muted",
                    )}
                    onMouseEnter={() => setSlashActiveIndex(index)}
                    onClick={() => executeSlashMenuItem(item)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current" />
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-muted-foreground">
            ↑↓ 选择 · Enter 确认 · Esc 关闭
          </div>
        </div>
      ) : null}
    </Slate>
  );
}
