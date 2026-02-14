"use client";

import { useCallback, useMemo } from "react";
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
import { CodeBlockElementView } from "./plugins/code-block/element";
import { CODE_BLOCK_TYPE, withCodeBlock } from "./plugins/code-block/logic";
import { DiagramBlockElementView } from "./plugins/diagram-block/element";
import { DIAGRAM_BLOCK_TYPE, withDiagramBlock } from "./plugins/diagram-block/logic";
import { EditorToolbar } from "./plugins/editor-toolbar";
import { ImageBlockElementView } from "./plugins/image-block/element";
import {
  getFirstImageFileFromClipboard,
  IMAGE_BLOCK_TYPE,
  insertImageBlock,
  withImageBlock,
} from "./plugins/image-block/logic";
import { uploadEditorImage } from "./plugins/image-block/upload";

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
  const anyLeaf = leaf as unknown as { bold?: boolean; italic?: boolean; underline?: boolean };

  let next = children;
  if (anyLeaf.bold) next = <strong>{next}</strong>;
  if (anyLeaf.italic) next = <em>{next}</em>;
  if (anyLeaf.underline) next = <u>{next}</u>;

  return (
    <span {...attributes}>
      {next}
    </span>
  );
}

function Element(props: RenderElementProps & { readOnly: boolean }) {
  const { attributes, children, element } = props;
  const el = element as SlateElement & { type?: string };

  switch (el.type) {
    case CODE_BLOCK_TYPE:
      return <CodeBlockElementView {...props} />;
    case DIAGRAM_BLOCK_TYPE:
      return <DiagramBlockElementView {...props} />;
    case IMAGE_BLOCK_TYPE:
      return <ImageBlockElementView {...props} />;
    case "heading-one":
      return (
        <h1 {...attributes} className="py-1 text-3xl font-bold tracking-tight">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} className="py-1 text-2xl font-semibold tracking-tight">
          {children}
        </h2>
      );
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          className="my-2 border-l-2 border-border pl-4 text-muted-foreground"
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul
          {...attributes}
          className="my-2 list-disc pl-6 [&_ul]:list-[circle] [&_ul_ul]:list-[square] [&_ul_ul_ul]:list-disc"
        >
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol
          {...attributes}
          className="my-2 list-decimal pl-6 [&_ol]:list-[lower-alpha] [&_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:list-decimal"
        >
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li {...attributes}>
          {children}
        </li>
      );
    default:
      return (
        <p {...attributes} className="py-1">
          {children}
        </p>
      );
  }
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
    () => withImageBlock(withDiagramBlock(withCodeBlock(withHistory(withReact(createEditor()))))),
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
