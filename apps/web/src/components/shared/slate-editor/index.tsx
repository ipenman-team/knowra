"use client";

import { useCallback, useMemo, type CSSProperties } from "react";
import { createEditor, Descendant, Element as SlateElement } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
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
import { toggleMark } from "./editor-format";
import { insertParagraphAfterSelectedBlockPlugin } from "./plugins/block-plugin-utils";
import { setBlockAlign } from "./plugins/align/logic";
import { CodeBlockElementView } from "./plugins/code-block/element";
import { CODE_BLOCK_TYPE, withCodeBlock } from "./plugins/code-block/logic";
import { DiagramBlockElementView } from "./plugins/diagram-block/element";
import { DIAGRAM_BLOCK_TYPE, withDiagramBlock } from "./plugins/diagram-block/logic";
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
  withTableBlock,
} from "./plugins/table-block/logic";
import {
  TableBlockElementView,
  TableCellElementView,
  TableRowElementView,
} from "./plugins/table-block/element";
import { PLUGIN_SCOPE_INLINE } from "./plugins/types";

export type SlateValue = Descendant[];

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
      onChange={(nextValue) => props.onChange(nextValue)}
    >
      {showToolbar ? <EditorToolbar disabled={props.disabled || readOnly} /> : null}
      <Editable
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
    </Slate>
  );
}
