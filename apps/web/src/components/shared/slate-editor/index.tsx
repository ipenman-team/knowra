"use client";

import {
  Bold,
  Copy,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Loader2,
  Link2,
  List,
  ListOrdered,
  Quote,
  Send,
  Sparkles,
  Table2,
  Underline,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  createEditor,
  Descendant,
  Editor,
  Element as SlateElement,
  Range as SlateRange,
  Text,
  Transforms,
  type NodeEntry,
  type RangeRef,
} from "slate";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { knowraAiApi, type InlineAiActionType } from "@/lib/api/knowra-ai";
import { cn } from "@/lib/utils";

import {
  canIndentListItem,
  handleEnterInList,
  indentListItem,
  isInListItem,
  outdentListItem,
} from "./list-commands";
import { isBlockActive, isMarkActive, toggleBlock, toggleMark } from "./editor-format";
import { insertParagraphAfterSelectedBlockPlugin } from "./plugins/block-plugin-utils";
import { setBlockAlign } from "./plugins/align/logic";
import { handleEnterInBlockQuote } from "./plugins/block-quote/logic";
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
import {
  DEFAULT_LINK_PLACEHOLDER_TEXT,
  DEFAULT_LINK_PLACEHOLDER_URL,
  LINK_MARK,
  getLinkAtSelection,
  getSelectionText,
  insertLinkText,
  withLink,
  normalizeLinkUrl,
} from "./plugins/link/logic";
import { LinkElementView } from "./plugins/link/element";
import { InlineLinkLeaf } from "./plugins/link/inline-link-leaf";
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
import {
  resolveInlineAiMode,
  type InlineAiMode,
  type SlateEditorInlineAiConfig,
} from "./plugins/knowra-ai/logic";

export type SlateValue = Descendant[];

const SLASH_MENU_WIDTH = 320;
const INLINE_TOOLBAR_BASE_WIDTH = 260;
const INLINE_TOOLBAR_WITH_AI_WIDTH = 304;
const INLINE_LINK_DIALOG_WIDTH = 420;
const READONLY_INLINE_TOOLBAR_WIDTH = 44;
const INLINE_AI_PANEL_MAX_WIDTH = 520;
const INLINE_AI_PANEL_MIN_WIDTH = 240;
const INLINE_AI_PANEL_ESTIMATED_HEIGHT = 360;
const INLINE_AI_SELECTED_TEXT_LIMIT = 2000;
const INLINE_AI_DEFAULT_TRANSLATE_TARGET = "中文";

type InlineAiPanelStatus = "menu-open" | "generating" | "done";

type InlineAiRequestAction = {
  actionType: InlineAiActionType;
  label: string;
  userPrompt?: string;
  actionParams?: {
    targetLanguage?: string;
  };
};

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

type InlineToolbarState = {
  range: SlateRange;
  top: number;
  left: number;
  placeBelow: boolean;
};

type InlineLinkDialogState = {
  range: SlateRange;
  top: number;
  left: number;
  placeAbove: boolean;
};

type ReadOnlyInlineAiToolbarState = {
  top: number;
  left: number;
  placeBelow: boolean;
  selectedText: string;
};

type InlineAiPanelState = {
  mode: Exclude<InlineAiMode, "off">;
  selectedText: string;
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
  range: SlateRange | null;
};

type DomSelectionInfo = {
  rect: DOMRect;
  selectedText: string;
  range: Range;
};

type InlineAiQuickAction = {
  actionType: InlineAiActionType;
  label: string;
  requireQuestion?: boolean;
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
    inlineAiSelectionHighlight?: boolean;
  };

  let next = children;
  if (anyLeaf.bold) next = <strong>{next}</strong>;
  if (anyLeaf.italic) next = <em>{next}</em>;
  if (anyLeaf.underline) next = <u>{next}</u>;

  const linkUrl = normalizeLeafLink(anyLeaf.link);
  if (linkUrl) {
    next = (
      <InlineLinkLeaf
        href={linkUrl}
        pluginScope={anyLeaf.pluginScope ?? PLUGIN_SCOPE_INLINE}
        pluginKind={anyLeaf.pluginKind ?? LINK_MARK}
      >
        {next}
      </InlineLinkLeaf>
    );
  }

  const inlineStyle: CSSProperties = {};
  const textColor = normalizeLeafColor(anyLeaf.textColor);
  if (textColor) inlineStyle.color = textColor;

  const backgroundColor = normalizeLeafColor(anyLeaf.backgroundColor);
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (anyLeaf.inlineAiSelectionHighlight) {
    inlineStyle.backgroundColor = "rgba(147, 197, 253, 0.55)";
    inlineStyle.borderRadius = "0.125rem";
  }

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
    case LINK_MARK:
      return <LinkElementView {...props} />;
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
    case "heading-three":
      return (
        <h3 {...attributes} className="py-1 text-xl font-semibold tracking-tight" style={alignStyle}>
          {children}
        </h3>
      );
    case "heading-four":
      return (
        <h4 {...attributes} className="py-1 text-lg font-semibold tracking-tight" style={alignStyle}>
          {children}
        </h4>
      );
    case "heading-five":
      return (
        <h5 {...attributes} className="py-1 text-base font-semibold tracking-tight" style={alignStyle}>
          {children}
        </h5>
      );
    case "heading-six":
      return (
        <h6 {...attributes} className="py-1 text-sm font-semibold tracking-tight" style={alignStyle}>
          {children}
        </h6>
      );
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          className="my-2 whitespace-pre-wrap border-l-2 border-border pl-4 text-muted-foreground"
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

function cloneSlateRange(range: SlateRange): SlateRange {
  return {
    anchor: {
      path: [...range.anchor.path],
      offset: range.anchor.offset,
    },
    focus: {
      path: [...range.focus.path],
      offset: range.focus.offset,
    },
  };
}

function getRangeViewportRect(editor: Editor, range: SlateRange) {
  try {
    const domRange = ReactEditor.toDOMRange(editor as ReactEditor, range);
    const firstRect = domRange.getClientRects()[0];
    return firstRect ?? domRange.getBoundingClientRect();
  } catch {
    return null;
  }
}

function getSelectionViewportRect(range: Range) {
  const firstRect = range.getClientRects()[0];
  return firstRect ?? range.getBoundingClientRect();
}

function getDomSelectionInfo(container: HTMLElement | null): DomSelectionInfo | null {
  if (typeof window === "undefined" || !container) return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const commonAncestorNode = range.commonAncestorContainer;
  const commonAncestorElement =
    commonAncestorNode.nodeType === Node.ELEMENT_NODE
      ? (commonAncestorNode as Element)
      : commonAncestorNode.parentElement;
  if (!commonAncestorElement) return null;
  if (!container.contains(commonAncestorElement)) return null;
  if (commonAncestorElement.closest(".cm-editor")) return null;

  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const rect = getSelectionViewportRect(range);
  if (!rect) return null;

  return {
    rect,
    selectedText,
    range: range.cloneRange(),
  };
}

function toSlateRangeFromDomRange(editor: Editor, domRange: Range): SlateRange | null {
  try {
    const range = ReactEditor.toSlateRange(editor as ReactEditor, domRange, {
      exactMatch: false,
      suppressThrow: true,
    });
    if (!range || !SlateRange.isExpanded(range)) return null;
    return cloneSlateRange(range);
  } catch {
    return null;
  }
}

function getInlineAiPanelPosition(rect: DOMRect) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const width = Math.min(
    INLINE_AI_PANEL_MAX_WIDTH,
    Math.max(INLINE_AI_PANEL_MIN_WIDTH, viewportWidth - 24),
  );
  const halfWidth = width / 2;
  const left = Math.min(
    Math.max(12 + halfWidth, rect.left + rect.width / 2),
    Math.max(12 + halfWidth, viewportWidth - halfWidth - 12),
  );

  const placeAbove = rect.bottom + INLINE_AI_PANEL_ESTIMATED_HEIGHT > viewportHeight - 16;
  const top = placeAbove ? rect.top - 10 : rect.bottom + 12;

  return { top, left, placeAbove, width };
}

function normalizeInlineAiSelectedText(input: string) {
  const normalized = input.trim();
  if (!normalized) return "";
  if (normalized.length <= INLINE_AI_SELECTED_TEXT_LIMIT) return normalized;
  return normalized.slice(0, INLINE_AI_SELECTED_TEXT_LIMIT);
}

function resolveInlineAiTargetLanguage(question: string) {
  const normalized = question.trim();
  if (!normalized) return INLINE_AI_DEFAULT_TRANSLATE_TARGET;
  return normalized;
}

export function SlateEditor(props: {
  value: SlateValue;
  onChange: (value: SlateValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showToolbar?: boolean;
  toolbarVariant?: "full" | "compact";
  topContent?: ReactNode;
  topContentClassName?: string;
  inlineAi?: SlateEditorInlineAiConfig;
}) {
  const editor = useMemo(
    () =>
      withImageBlock(
        withDiagramBlock(
          withCodeBlock(withTableBlock(withLink(withHistory(withReact(createEditor()))))),
        ),
      ),
    [],
  );
  const showToolbar = props.showToolbar ?? true;
  const readOnly = Boolean(props.readOnly ?? false);
  const editorReadOnly = Boolean(props.disabled || readOnly);
  const inlineAiMode = resolveInlineAiMode({
    config: props.inlineAi,
    editorReadOnly,
  });
  const inlineToolbarWidth =
    inlineAiMode === "edit" ? INLINE_TOOLBAR_WITH_AI_WIDTH : INLINE_TOOLBAR_BASE_WIDTH;
  const editableRef = useRef<HTMLDivElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const inlineToolbarRef = useRef<HTMLDivElement | null>(null);
  const readOnlyInlineToolbarRef = useRef<HTMLDivElement | null>(null);
  const inlineAiPanelRef = useRef<HTMLDivElement | null>(null);
  const inlineLinkDialogRef = useRef<HTMLDivElement | null>(null);
  const [slashMenuState, setSlashMenuState] = useState<SlashMenuState | null>(null);
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);
  const [inlineToolbarState, setInlineToolbarState] = useState<InlineToolbarState | null>(null);
  const [inlineLinkDialogState, setInlineLinkDialogState] = useState<InlineLinkDialogState | null>(
    null,
  );
  const [readOnlyInlineAiToolbarState, setReadOnlyInlineAiToolbarState] =
    useState<ReadOnlyInlineAiToolbarState | null>(null);
  const [inlineAiPanelState, setInlineAiPanelState] = useState<InlineAiPanelState | null>(null);
  const [inlineAiQuestion, setInlineAiQuestion] = useState("");
  const [inlineAiStatus, setInlineAiStatus] = useState<InlineAiPanelStatus>("menu-open");
  const [inlineAiResult, setInlineAiResult] = useState("");
  const [inlineAiError, setInlineAiError] = useState<string | null>(null);
  const [inlineAiLastAction, setInlineAiLastAction] =
    useState<InlineAiRequestAction | null>(null);
  const inlineAiRangeRef = useRef<RangeRef | null>(null);
  const inlineAiAbortRef = useRef<AbortController | null>(null);
  const inlineAiRequestSerialRef = useRef(0);
  const [inlineLinkText, setInlineLinkText] = useState(DEFAULT_LINK_PLACEHOLDER_TEXT);
  const [inlineLinkUrl, setInlineLinkUrl] = useState(DEFAULT_LINK_PLACEHOLDER_URL);

  const inlineAiEditQuickActions = useMemo<InlineAiQuickAction[]>(
    () => [
      { actionType: "rewrite", label: "改写" },
      { actionType: "condense", label: "精简" },
      { actionType: "expand", label: "扩写" },
      { actionType: "summarize", label: "摘要" },
      { actionType: "translate", label: "翻译" },
      { actionType: "custom", label: "自由提问", requireQuestion: true },
    ],
    [],
  );
  const inlineAiReadOnlyQuickActions = useMemo<InlineAiQuickAction[]>(
    () => [
      { actionType: "qa", label: "问答" },
      { actionType: "translate", label: "翻译" },
    ],
    [],
  );

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

  const normalizedInlineLinkUrl = useMemo(() => normalizeLinkUrl(inlineLinkUrl), [inlineLinkUrl]);
  const hasInlineLinkValidationError =
    inlineLinkUrl.trim().length > 0 && !normalizedInlineLinkUrl;
  const canApplyInlineLink = Boolean(normalizedInlineLinkUrl && inlineLinkText.trim().length > 0);
  const normalizedInlineAiQuestion = inlineAiQuestion.trim();
  const inlineAiGenerating = inlineAiStatus === "generating";
  const inlineAiHasResult = inlineAiResult.trim().length > 0;

  const clearInlineAiAbortController = useCallback(() => {
    inlineAiAbortRef.current?.abort();
    inlineAiAbortRef.current = null;
  }, []);

  const clearInlineAiRangeRef = useCallback(() => {
    inlineAiRangeRef.current?.unref();
    inlineAiRangeRef.current = null;
  }, []);

  const syncInlineToolbarState = useCallback(() => {
    if (editorReadOnly || inlineLinkDialogState || slashMenuState || inlineAiPanelState) {
      setInlineToolbarState(null);
      return;
    }
    if (!editor.selection || !SlateRange.isExpanded(editor.selection)) {
      setInlineToolbarState(null);
      return;
    }

    const range = cloneSlateRange(editor.selection);
    const rect = getRangeViewportRect(editor, range);
    if (!rect) {
      setInlineToolbarState(null);
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const halfWidth = inlineToolbarWidth / 2;
    const left = Math.min(
      Math.max(12 + halfWidth, rect.left + rect.width / 2),
      Math.max(12 + halfWidth, viewportWidth - halfWidth - 12),
    );
    const placeBelow = rect.top < 96;
    const top = placeBelow ? rect.bottom + 8 : rect.top - 8;

    setInlineToolbarState((prev) => {
      if (
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.placeBelow === placeBelow &&
        SlateRange.equals(prev.range, range)
      ) {
        return prev;
      }
      return { range, top, left, placeBelow };
    });
  }, [
    editor,
    editorReadOnly,
    inlineAiPanelState,
    inlineLinkDialogState,
    inlineToolbarWidth,
    slashMenuState,
  ]);

  const updateInlineLinkDialogPosition = useCallback(() => {
    if (!inlineLinkDialogState) return;

    const rect = getRangeViewportRect(editor, inlineLinkDialogState.range);
    if (!rect) return;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const halfWidth = INLINE_LINK_DIALOG_WIDTH / 2;
    const left = Math.min(
      Math.max(12 + halfWidth, rect.left + rect.width / 2),
      Math.max(12 + halfWidth, viewportWidth - halfWidth - 12),
    );

    const preferAbove = rect.bottom + 320 > viewportHeight - 16;
    const top = preferAbove ? rect.top - 8 : rect.bottom + 10;

    setInlineLinkDialogState((prev) => {
      if (!prev) return prev;
      if (
        prev.top === top &&
        prev.left === left &&
        prev.placeAbove === preferAbove
      ) {
        return prev;
      }
      return {
        ...prev,
        top,
        left,
        placeAbove: preferAbove,
      };
    });
  }, [editor, inlineLinkDialogState]);

  const openInlineLinkDialog = useCallback(() => {
    if (editorReadOnly) return;
    if (!editor.selection || !SlateRange.isExpanded(editor.selection)) return;

    const range = cloneSlateRange(editor.selection);
    const rect = getRangeViewportRect(editor, range);
    if (!rect) return;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const halfWidth = INLINE_LINK_DIALOG_WIDTH / 2;
    const left = Math.min(
      Math.max(12 + halfWidth, rect.left + rect.width / 2),
      Math.max(12 + halfWidth, viewportWidth - halfWidth - 12),
    );
    const preferAbove = rect.bottom + 320 > viewportHeight - 16;
    const top = preferAbove ? rect.top - 8 : rect.bottom + 10;

    const selectedText = getSelectionText(editor, range);
    const activeLink = getLinkAtSelection(editor, range);

    setInlineLinkText(activeLink?.text || selectedText || DEFAULT_LINK_PLACEHOLDER_TEXT);
    setInlineLinkUrl(activeLink?.url || DEFAULT_LINK_PLACEHOLDER_URL);
    setInlineLinkDialogState({
      range,
      top,
      left,
      placeAbove: preferAbove,
    });
    setInlineToolbarState(null);
  }, [editor, editorReadOnly]);

  const closeInlineLinkDialog = useCallback(() => {
    setInlineLinkDialogState(null);
    ReactEditor.focus(editor);
    requestAnimationFrame(() => {
      syncInlineToolbarState();
    });
  }, [editor, syncInlineToolbarState]);

  const applyInlineLink = useCallback(() => {
    if (!inlineLinkDialogState || !canApplyInlineLink) return;

    try {
      Transforms.select(editor, inlineLinkDialogState.range);
    } catch {
      return;
    }

    ReactEditor.focus(editor);
    const inserted = insertLinkText(editor, {
      text: inlineLinkText,
      url: inlineLinkUrl,
      selection: inlineLinkDialogState.range,
    });

    if (!inserted) return;
    setInlineLinkDialogState(null);
  }, [canApplyInlineLink, editor, inlineLinkDialogState, inlineLinkText, inlineLinkUrl]);

  const getInlineAiTrackedRange = useCallback((): SlateRange | null => {
    if (!inlineAiPanelState || inlineAiPanelState.mode !== "edit") return null;
    const tracked = inlineAiRangeRef.current?.current;
    if (!tracked || !SlateRange.isExpanded(tracked)) return null;
    return cloneSlateRange(tracked);
  }, [inlineAiPanelState]);

  const runInlineAiAction = useCallback(
    async (action: InlineAiRequestAction) => {
      if (!inlineAiPanelState) return;

      const selectedText = normalizeInlineAiSelectedText(inlineAiPanelState.selectedText);
      if (!selectedText) {
        setInlineAiError("选中文本为空，请重新划词后重试。");
        return;
      }

      const requestSerial = inlineAiRequestSerialRef.current + 1;
      inlineAiRequestSerialRef.current = requestSerial;
      clearInlineAiAbortController();
      const controller = new AbortController();
      inlineAiAbortRef.current = controller;

      setInlineAiStatus("generating");
      setInlineAiResult("");
      setInlineAiError(null);
      setInlineAiLastAction(action);

      let receivedDelta = false;
      try {
        await knowraAiApi.inlineActionStream(
          {
            selectedText,
            actionType: action.actionType,
            userPrompt: action.userPrompt,
            actionParams: action.actionParams,
            context: {
              pageId: props.inlineAi?.pageId,
              spaceId: props.inlineAi?.spaceId,
              mode: inlineAiPanelState.mode,
            },
          },
          {
            onDelta: (delta) => {
              if (inlineAiRequestSerialRef.current !== requestSerial) return;
              receivedDelta = true;
              setInlineAiResult((prev) => prev + delta);
            },
          },
          { signal: controller.signal },
        );

        if (inlineAiRequestSerialRef.current !== requestSerial) return;
        setInlineAiStatus("done");
        if (!receivedDelta) {
          setInlineAiError("未生成内容，请重试。");
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (inlineAiRequestSerialRef.current !== requestSerial) return;
        const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
        setInlineAiStatus("done");
        setInlineAiError(message || "生成失败，请稍后重试。");
      } finally {
        if (inlineAiRequestSerialRef.current === requestSerial) {
          inlineAiAbortRef.current = null;
        }
      }
    },
    [clearInlineAiAbortController, inlineAiPanelState, props.inlineAi?.pageId, props.inlineAi?.spaceId],
  );

  const openInlineAiPanel = useCallback(
    (params: {
      mode: Exclude<InlineAiMode, "off">;
      selectedText: string;
      rect: DOMRect;
      range: SlateRange | null;
    }) => {
      const normalizedText = normalizeInlineAiSelectedText(params.selectedText);
      if (!normalizedText) return;

      inlineAiRequestSerialRef.current += 1;
      clearInlineAiAbortController();
      clearInlineAiRangeRef();
      const position = getInlineAiPanelPosition(params.rect);
      const nextRange = params.range ? cloneSlateRange(params.range) : null;
      if (params.mode === "edit" && nextRange) {
        inlineAiRangeRef.current = Editor.rangeRef(editor, nextRange, {
          affinity: "inward",
        });
      }

      setInlineAiQuestion("");
      setInlineAiStatus("menu-open");
      setInlineAiResult("");
      setInlineAiError(null);
      setInlineAiLastAction(null);
      setInlineAiPanelState({
        mode: params.mode,
        selectedText: normalizedText,
        top: position.top,
        left: position.left,
        width: position.width,
        placeAbove: position.placeAbove,
        range: nextRange,
      });
      setInlineToolbarState(null);
      setReadOnlyInlineAiToolbarState(null);
    },
    [clearInlineAiAbortController, clearInlineAiRangeRef, editor],
  );

  const openInlineAiPanelFromEditorSelection = useCallback(() => {
    if (inlineAiMode !== "edit") return;
    if (!inlineToolbarState) return;

    const rect = getRangeViewportRect(editor, inlineToolbarState.range);
    if (!rect) return;

    const selectedText = getSelectionText(editor, inlineToolbarState.range);
    openInlineAiPanel({
      mode: "edit",
      selectedText,
      rect,
      range: inlineToolbarState.range,
    });
  }, [editor, inlineAiMode, inlineToolbarState, openInlineAiPanel]);

  const openInlineAiPanelFromReadOnlySelection = useCallback(() => {
    if (inlineAiMode !== "readonly") return;

    const selectionInfo = getDomSelectionInfo(editableRef.current);
    if (!selectionInfo) return;
    const slateRange = toSlateRangeFromDomRange(editor, selectionInfo.range);

    openInlineAiPanel({
      mode: "readonly",
      selectedText: selectionInfo.selectedText,
      rect: selectionInfo.rect,
      range: slateRange,
    });
  }, [editor, inlineAiMode, openInlineAiPanel]);

  const syncReadOnlyInlineAiToolbarState = useCallback(() => {
    if (inlineAiMode !== "readonly" || inlineAiPanelState) {
      setReadOnlyInlineAiToolbarState(null);
      return;
    }
    if (inlineLinkDialogState || slashMenuState) {
      setReadOnlyInlineAiToolbarState(null);
      return;
    }

    const selectionInfo = getDomSelectionInfo(editableRef.current);
    if (!selectionInfo) {
      setReadOnlyInlineAiToolbarState(null);
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const halfWidth = READONLY_INLINE_TOOLBAR_WIDTH / 2;
    const left = Math.min(
      Math.max(12 + halfWidth, selectionInfo.rect.left + selectionInfo.rect.width / 2),
      Math.max(12 + halfWidth, viewportWidth - halfWidth - 12),
    );
    const placeBelow = selectionInfo.rect.top < 96;
    const top = placeBelow ? selectionInfo.rect.bottom + 8 : selectionInfo.rect.top - 8;

    setReadOnlyInlineAiToolbarState((prev) => {
      if (
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.placeBelow === placeBelow &&
        prev.selectedText === selectionInfo.selectedText
      ) {
        return prev;
      }

      return {
        top,
        left,
        placeBelow,
        selectedText: selectionInfo.selectedText,
      };
    });
  }, [inlineAiMode, inlineAiPanelState, inlineLinkDialogState, slashMenuState]);

  const updateInlineAiPanelPosition = useCallback(() => {
    if (!inlineAiPanelState) return;

    if (inlineAiPanelState.mode === "edit") {
      const trackedRange = getInlineAiTrackedRange();
      if (!trackedRange) return;

      const rect = getRangeViewportRect(editor, trackedRange);
      if (!rect) return;

      const position = getInlineAiPanelPosition(rect);
      setInlineAiPanelState((prev) => {
        if (!prev) return prev;
        if (
          prev.top === position.top &&
          prev.left === position.left &&
          prev.width === position.width &&
          prev.placeAbove === position.placeAbove &&
          prev.range &&
          SlateRange.equals(prev.range, trackedRange)
        ) {
          return prev;
        }
        return {
          ...prev,
          top: position.top,
          left: position.left,
          width: position.width,
          placeAbove: position.placeAbove,
          range: trackedRange,
        };
      });
      return;
    }

    const selectionInfo = getDomSelectionInfo(editableRef.current);
    if (!selectionInfo) return;
    const position = getInlineAiPanelPosition(selectionInfo.rect);

    setInlineAiPanelState((prev) => {
      if (!prev) return prev;
      if (
        prev.top === position.top &&
        prev.left === position.left &&
        prev.width === position.width &&
        prev.placeAbove === position.placeAbove &&
        prev.selectedText === selectionInfo.selectedText
      ) {
        return prev;
      }
      return {
        ...prev,
        selectedText: selectionInfo.selectedText,
        top: position.top,
        left: position.left,
        width: position.width,
        placeAbove: position.placeAbove,
      };
    });
  }, [editor, getInlineAiTrackedRange, inlineAiPanelState]);

  const stopInlineAiGeneration = useCallback(() => {
    if (!inlineAiGenerating) return;
    clearInlineAiAbortController();
    inlineAiRequestSerialRef.current += 1;
    setInlineAiStatus("done");
  }, [clearInlineAiAbortController, inlineAiGenerating]);

  const closeInlineAiPanel = useCallback(() => {
    inlineAiRequestSerialRef.current += 1;
    clearInlineAiAbortController();
    clearInlineAiRangeRef();
    setInlineAiPanelState(null);
    setInlineAiQuestion("");
    setInlineAiStatus("menu-open");
    setInlineAiResult("");
    setInlineAiError(null);
    setInlineAiLastAction(null);

    requestAnimationFrame(() => {
      syncInlineToolbarState();
      syncReadOnlyInlineAiToolbarState();
    });
  }, [
    clearInlineAiAbortController,
    clearInlineAiRangeRef,
    syncInlineToolbarState,
    syncReadOnlyInlineAiToolbarState,
  ]);

  const triggerInlineAiQuickAction = useCallback(
    (quickAction: InlineAiQuickAction) => {
      if (!inlineAiPanelState) return;
      if (inlineAiGenerating) return;
      if (quickAction.requireQuestion && !normalizedInlineAiQuestion) {
        setInlineAiError("请输入问题后再发送。");
        return;
      }

      const nextAction: InlineAiRequestAction = {
        actionType: quickAction.actionType,
        label: quickAction.label,
      };

      if (quickAction.actionType === "translate") {
        nextAction.actionParams = {
          targetLanguage: resolveInlineAiTargetLanguage(normalizedInlineAiQuestion),
        };
      }
      if (quickAction.actionType === "custom") {
        nextAction.userPrompt = normalizedInlineAiQuestion;
      }
      if (quickAction.actionType === "qa" && normalizedInlineAiQuestion) {
        nextAction.userPrompt = normalizedInlineAiQuestion;
      }

      void runInlineAiAction(nextAction);
    },
    [inlineAiGenerating, inlineAiPanelState, normalizedInlineAiQuestion, runInlineAiAction],
  );

  const sendInlineAiQuestion = useCallback(() => {
    if (!inlineAiPanelState) return;
    if (inlineAiGenerating) return;
    if (!normalizedInlineAiQuestion) {
      setInlineAiError("请输入问题后再发送。");
      return;
    }

    if (inlineAiPanelState.mode === "edit") {
      void runInlineAiAction({
        actionType: "custom",
        label: "自由提问",
        userPrompt: normalizedInlineAiQuestion,
      });
      return;
    }

    void runInlineAiAction({
      actionType: "qa",
      label: "问答",
      userPrompt: normalizedInlineAiQuestion,
    });
  }, [inlineAiGenerating, inlineAiPanelState, normalizedInlineAiQuestion, runInlineAiAction]);

  const regenerateInlineAiResult = useCallback(() => {
    if (!inlineAiLastAction) return;
    if (inlineAiGenerating) return;
    void runInlineAiAction(inlineAiLastAction);
  }, [inlineAiGenerating, inlineAiLastAction, runInlineAiAction]);

  const resolveInlineAiWritableRange = useCallback(() => {
    if (!inlineAiPanelState || inlineAiPanelState.mode !== "edit") return null;
    const tracked = inlineAiRangeRef.current?.current;
    if (!tracked || !SlateRange.isExpanded(tracked)) return null;
    return cloneSlateRange(tracked);
  }, [inlineAiPanelState]);

  const replaceInlineAiResult = useCallback(() => {
    const nextText = inlineAiResult.trim();
    if (!nextText) {
      setInlineAiError("暂无可写入内容。");
      return;
    }

    const writableRange = resolveInlineAiWritableRange();
    if (!writableRange) {
      setInlineAiError("选区已变化，请重新划词后重试。");
      return;
    }

    try {
      Transforms.select(editor, writableRange);
      ReactEditor.focus(editor);
      Transforms.insertText(editor, nextText);
      closeInlineAiPanel();
    } catch {
      setInlineAiError("写入失败，请重新划词后重试。");
    }
  }, [closeInlineAiPanel, editor, inlineAiResult, resolveInlineAiWritableRange]);

  const insertInlineAiResultBelow = useCallback(() => {
    const nextText = inlineAiResult.trim();
    if (!nextText) {
      setInlineAiError("暂无可写入内容。");
      return;
    }

    const writableRange = resolveInlineAiWritableRange();
    if (!writableRange) {
      setInlineAiError("选区已变化，请重新划词后重试。");
      return;
    }

    try {
      Transforms.select(editor, writableRange);
      Transforms.collapse(editor, { edge: "end" });
      ReactEditor.focus(editor);
      Editor.insertBreak(editor);
      Transforms.insertText(editor, nextText);
      closeInlineAiPanel();
    } catch {
      setInlineAiError("插入失败，请重新划词后重试。");
    }
  }, [closeInlineAiPanel, editor, inlineAiResult, resolveInlineAiWritableRange]);

  const copyInlineAiResult = useCallback(async () => {
    const nextText = inlineAiResult.trim();
    if (!nextText) {
      setInlineAiError("暂无可复制内容。");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setInlineAiError("当前环境不支持复制，请手动复制。");
      return;
    }

    try {
      await navigator.clipboard.writeText(nextText);
      setInlineAiError(null);
    } catch {
      setInlineAiError("复制失败，请手动复制。");
    }
  }, [inlineAiResult]);

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

  useEffect(() => {
    if (editorReadOnly) return;

    const sync = () => {
      syncInlineToolbarState();
    };

    window.addEventListener("mouseup", sync, true);
    window.addEventListener("keyup", sync, true);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.removeEventListener("mouseup", sync, true);
      window.removeEventListener("keyup", sync, true);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [editorReadOnly, syncInlineToolbarState]);

  useEffect(() => {
    if (inlineAiMode !== "readonly") return;

    const sync = () => {
      syncReadOnlyInlineAiToolbarState();
    };

    window.addEventListener("mouseup", sync, true);
    window.addEventListener("keyup", sync, true);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.removeEventListener("mouseup", sync, true);
      window.removeEventListener("keyup", sync, true);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [inlineAiMode, syncReadOnlyInlineAiToolbarState]);

  useEffect(() => {
    if (!inlineAiPanelState) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && inlineAiPanelRef.current?.contains(target)) return;
      if (target && inlineToolbarRef.current?.contains(target)) return;
      if (target && readOnlyInlineToolbarRef.current?.contains(target)) return;
      closeInlineAiPanel();
    };

    const onViewportChange = () => {
      updateInlineAiPanelPosition();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeInlineAiPanel();
    };

    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [closeInlineAiPanel, inlineAiPanelState, updateInlineAiPanelPosition]);

  useEffect(() => {
    return () => {
      clearInlineAiAbortController();
      clearInlineAiRangeRef();
    };
  }, [clearInlineAiAbortController, clearInlineAiRangeRef]);

  useEffect(() => {
    if (!inlineLinkDialogState) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && inlineLinkDialogRef.current?.contains(target)) return;
      if (target && inlineToolbarRef.current?.contains(target)) return;
      setInlineLinkDialogState(null);
      requestAnimationFrame(() => {
        syncInlineToolbarState();
      });
    };

    const onViewportChange = () => {
      updateInlineLinkDialogPosition();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeInlineLinkDialog();
    };

    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [
    closeInlineLinkDialog,
    inlineLinkDialogState,
    syncInlineToolbarState,
    updateInlineLinkDialogPosition,
  ]);

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

  const decorate = useCallback(
    ([node, path]: NodeEntry) => {
      if (!inlineAiPanelState) return [];
      if (!Text.isText(node)) return [];

      const highlightRange =
        inlineAiPanelState.mode === "edit"
          ? getInlineAiTrackedRange()
          : inlineAiPanelState.range;
      if (!highlightRange) return [];

      const nodeRange: SlateRange = {
        anchor: {
          path,
          offset: 0,
        },
        focus: {
          path,
          offset: node.text.length,
        },
      };
      const intersection = SlateRange.intersection(highlightRange, nodeRange);
      if (!intersection) return [];

      return [{ ...intersection, inlineAiSelectionHighlight: true }];
    },
    [getInlineAiTrackedRange, inlineAiPanelState],
  );

  const inlineAiWritableRange =
    inlineAiPanelState?.mode === "edit" ? resolveInlineAiWritableRange() : null;
  const inlineAiSelectionInvalid =
    inlineAiPanelState?.mode === "edit" && inlineAiStatus === "done" && !inlineAiWritableRange;
  const inlineAiQuickActions =
    inlineAiPanelState?.mode === "edit" ? inlineAiEditQuickActions : inlineAiReadOnlyQuickActions;

  return (
    <Slate
      editor={editor}
      initialValue={props.value}
      onChange={(nextValue) => {
        props.onChange(nextValue);
        updateInlineAiPanelPosition();
        syncSlashMenuState();
        syncInlineToolbarState();
        syncReadOnlyInlineAiToolbarState();
      }}
    >
      {showToolbar ? (
        <EditorToolbar
          disabled={props.disabled || readOnly}
          variant={props.toolbarVariant ?? "full"}
        />
      ) : null}
      {props.topContent ? (
        <div className={cn("pb-2", props.topContentClassName)}>
          {props.topContent}
        </div>
      ) : null}
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
        decorate={decorate}
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

            if (handleEnterInBlockQuote(editor)) {
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

      {inlineAiMode === "readonly" && readOnlyInlineAiToolbarState && !inlineAiPanelState ? (
        <div
          ref={readOnlyInlineToolbarRef}
          contentEditable={false}
          className="fixed z-50 flex items-center justify-center rounded-md border border-input bg-background p-1 shadow-lg"
          style={{
            top: `${readOnlyInlineAiToolbarState.top}px`,
            left: `${readOnlyInlineAiToolbarState.left}px`,
            width: `${READONLY_INLINE_TOOLBAR_WIDTH}px`,
            transform: readOnlyInlineAiToolbarState.placeBelow
              ? "translate(-50%, 0)"
              : "translate(-50%, -100%)",
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 px-0"
            tooltip="Knowra AI"
            onMouseDown={(event) => {
              event.preventDefault();
              openInlineAiPanelFromReadOnlySelection();
            }}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {!editorReadOnly && inlineToolbarState && !inlineLinkDialogState ? (
        <div
          ref={inlineToolbarRef}
          contentEditable={false}
          className="fixed z-50 flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 shadow-lg"
          style={{
            top: `${inlineToolbarState.top}px`,
            left: `${inlineToolbarState.left}px`,
            width: `${inlineToolbarWidth}px`,
            transform: inlineToolbarState.placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Button
            type="button"
            variant={isMarkActive(editor, "bold") ? "secondary" : "ghost"}
            className="h-8 w-8 px-0"
            tooltip="加粗"
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, "bold");
            }}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={isMarkActive(editor, "italic") ? "secondary" : "ghost"}
            className="h-8 w-8 px-0"
            tooltip="斜体"
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, "italic");
            }}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={isMarkActive(editor, "underline") ? "secondary" : "ghost"}
            className="h-8 w-8 px-0"
            tooltip="下划线"
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, "underline");
            }}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 px-0"
            tooltip="链接"
            onMouseDown={(event) => {
              event.preventDefault();
              openInlineLinkDialog();
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>

          {inlineAiMode === "edit" ? (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-5" />

              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 px-0"
                tooltip="Knowra AI"
                onMouseDown={(event) => {
                  event.preventDefault();
                  openInlineAiPanelFromEditorSelection();
                }}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {inlineAiPanelState && inlineAiMode === inlineAiPanelState.mode ? (
        <div
          ref={inlineAiPanelRef}
          contentEditable={false}
          className="fixed z-50 space-y-4 rounded-lg border border-input bg-background p-4 shadow-xl"
          style={{
            top: `${inlineAiPanelState.top}px`,
            left: `${inlineAiPanelState.left}px`,
            width: `${inlineAiPanelState.width}px`,
            transform: inlineAiPanelState.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Knowra AI</div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 px-0"
              tooltip="关闭"
              onClick={closeInlineAiPanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={inlineAiQuestion}
              placeholder="向智能助手提问..."
              onChange={(event) => {
                setInlineAiQuestion(event.target.value);
                if (inlineAiError) setInlineAiError(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                sendInlineAiQuestion();
              }}
            />
            <Button
              type="button"
              className="h-10 w-10 px-0"
              disabled={inlineAiGenerating || normalizedInlineAiQuestion.length === 0}
              tooltip="发送"
              onClick={sendInlineAiQuestion}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">发送</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {inlineAiQuickActions.map((item) => (
              <Button
                key={item.label}
                type="button"
                variant="outline"
                className="justify-start"
                disabled={
                  inlineAiGenerating || (item.requireQuestion && normalizedInlineAiQuestion.length === 0)
                }
                onClick={() => triggerInlineAiQuickAction(item)}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            {inlineAiResult ? (
              <p className="whitespace-pre-wrap leading-6">{inlineAiResult}</p>
            ) : (
              <p className="text-muted-foreground">
                {inlineAiStatus === "menu-open"
                  ? "选择动作开始生成结果。"
                  : inlineAiGenerating
                    ? "正在生成..."
                    : "暂无生成内容。"}
              </p>
            )}
          </div>

          {inlineAiSelectionInvalid ? (
            <p className="text-xs text-amber-600">选区已变化，请重新划词后重试。</p>
          ) : null}

          {inlineAiError ? (
            <p className="text-xs text-destructive">{inlineAiError}</p>
          ) : null}

          {inlineAiGenerating ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在生成
              </div>
              <Button type="button" variant="outline" size="sm" onClick={stopInlineAiGeneration}>
                停止
              </Button>
            </div>
          ) : null}

          {inlineAiStatus === "done" ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {inlineAiPanelState.mode === "edit" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!inlineAiHasResult || inlineAiSelectionInvalid}
                    onClick={insertInlineAiResultBelow}
                  >
                    插入选区下方
                  </Button>
                  <Button
                    type="button"
                    disabled={!inlineAiHasResult || inlineAiSelectionInvalid}
                    onClick={replaceInlineAiResult}
                  >
                    替换选中内容
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" disabled={!inlineAiHasResult} onClick={copyInlineAiResult}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  复制
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={!inlineAiLastAction}
                onClick={regenerateInlineAiResult}
              >
                重新生成
              </Button>
              <Button type="button" variant="ghost" onClick={closeInlineAiPanel}>
                关闭
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!editorReadOnly && inlineLinkDialogState ? (
        <div
          ref={inlineLinkDialogRef}
          contentEditable={false}
          className="fixed z-50 w-[420px] space-y-5 rounded-md border border-input bg-background p-6 shadow-xl"
          style={{
            top: `${inlineLinkDialogState.top}px`,
            left: `${inlineLinkDialogState.left}px`,
            transform: inlineLinkDialogState.placeAbove
              ? "translate(-50%, -100%)"
              : "translate(-50%, 0)",
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="space-y-2">
            <div className="text-sm font-medium">文本</div>
            <Input
              value={inlineLinkText}
              placeholder={DEFAULT_LINK_PLACEHOLDER_TEXT}
              onChange={(event) => setInlineLinkText(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">链接</div>
            <Input
              value={inlineLinkUrl}
              placeholder="请输入链接"
              aria-invalid={hasInlineLinkValidationError}
              className={cn(
                hasInlineLinkValidationError && "border-destructive focus-visible:ring-destructive",
              )}
              onChange={(event) => setInlineLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                applyInlineLink();
              }}
            />
            {hasInlineLinkValidationError ? (
              <p className="text-sm text-destructive">请输入正确的链接</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeInlineLinkDialog}>
              取消
            </Button>
            <Button type="button" disabled={!canApplyInlineLink} onClick={applyInlineLink}>
              应用
            </Button>
          </div>
        </div>
      ) : null}

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
