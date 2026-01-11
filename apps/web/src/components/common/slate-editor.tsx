"use client";

import { useCallback, useMemo } from "react";
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  Slate,
  useSlate,
  withReact,
  type RenderElementProps,
  type RenderLeafProps,
} from "slate-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type SlateValue = Descendant[];

type BlockFormat =
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "block-quote"
  | "numbered-list"
  | "bulleted-list";

type MarkFormat = "bold" | "italic" | "underline";

const LIST_TYPES: BlockFormat[] = ["numbered-list", "bulleted-list"];

export function parseContentToSlateValue(content: string | null | undefined): SlateValue {
  if (!content) {
    return [
      {
        type: "paragraph",
        children: [{ text: "" }],
      } as any,
    ];
  }

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as SlateValue;
    }
  } catch {
    // ignore
  }

  return [
    {
      type: "paragraph",
      children: [{ text: content }],
    } as any,
  ];
}

export function serializeSlateValue(value: SlateValue): string {
  return JSON.stringify(value);
}

function Leaf(props: RenderLeafProps) {
  const { attributes, children, leaf } = props;
  const anyLeaf = leaf as any;

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

function Element(props: RenderElementProps) {
  const { attributes, children, element } = props;
  const el = element as SlateElement & { type?: string };

  switch (el.type) {
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
        <ul {...attributes} className="my-2 list-disc pl-6">
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol {...attributes} className="my-2 list-decimal pl-6">
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

function isMarkActive(editor: Editor, format: MarkFormat) {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  return Boolean(marks?.[format]);
}

function toggleMark(editor: Editor, format: MarkFormat) {
  const active = isMarkActive(editor, format);
  if (active) Editor.removeMark(editor, format);
  else Editor.addMark(editor, format, true);
}

function isBlockActive(editor: Editor, format: BlockFormat) {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
  });
  return Boolean(match);
}

function toggleBlock(editor: Editor, format: BlockFormat) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(((n as any).type ?? "paragraph") as BlockFormat),
    split: true,
  });

  const nextType = isActive ? "paragraph" : isList ? "list-item" : format;
  Transforms.setNodes(editor, { type: nextType } as any, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === "list-item",
    });
  }
}

function ToolbarButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <Button
      type="button"
      variant={props.active ? "secondary" : "ghost"}
      className="h-8 px-2 text-xs"
      disabled={props.disabled}
      onMouseDown={props.onMouseDown}
    >
      {props.label}
    </Button>
  );
}

function EditorToolbar(props: { disabled?: boolean }) {
  const editor = useSlate();
  const disabled = props.disabled;

  return (
    <div
      className={cn(
        "sticky top-12 z-10 -mx-1 mb-3 flex items-center gap-1",
        "rounded-md border bg-background px-2 py-1",
      )}
    >
      <ToolbarButton
        label="↶"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          (editor as any).undo?.();
        }}
      />
      <ToolbarButton
        label="↷"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          (editor as any).redo?.();
        }}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        label="H1"
        active={isBlockActive(editor, "heading-one")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, "heading-one");
        }}
      />
      <ToolbarButton
        label="H2"
        active={isBlockActive(editor, "heading-two")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, "heading-two");
        }}
      />
      <ToolbarButton
        label="❝"
        active={isBlockActive(editor, "block-quote")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, "block-quote");
        }}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        label="B"
        active={isMarkActive(editor, "bold")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "bold");
        }}
      />
      <ToolbarButton
        label="I"
        active={isMarkActive(editor, "italic")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "italic");
        }}
      />
      <ToolbarButton
        label="U"
        active={isMarkActive(editor, "underline")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "underline");
        }}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        label="•"
        active={isBlockActive(editor, "bulleted-list")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, "bulleted-list");
        }}
      />
      <ToolbarButton
        label="1."
        active={isBlockActive(editor, "numbered-list")}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, "numbered-list");
        }}
      />
    </div>
  );
}

export function SlateEditor(props: {
  value: SlateValue;
  onChange: (value: SlateValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderLeaf = useCallback((leafProps: RenderLeafProps) => {
    return <Leaf {...leafProps} />;
  }, []);

  const renderElement = useCallback((elementProps: RenderElementProps) => {
    return <Element {...elementProps} />;
  }, []);

  return (
    <Slate
      editor={editor}
      initialValue={props.value}
      onChange={(nextValue) => props.onChange(nextValue)}
    >
      <EditorToolbar disabled={props.disabled} />
      <Editable
        className={cn(
          "min-h-[45vh] w-full rounded-md bg-background px-1 py-2 text-[15px] leading-7",
          "focus-visible:outline-none",
          props.disabled && "opacity-70",
          props.className,
        )}
        placeholder={props.placeholder}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        readOnly={props.disabled}
        onKeyDown={(e) => {
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
      />
    </Slate>
  );
}
