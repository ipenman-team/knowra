import { Editor, Element as SlateElement, Transforms } from "slate";

export const ALIGN_OPTIONS = ["left", "center", "right", "justify"] as const;

export type AlignFormat = (typeof ALIGN_OPTIONS)[number];

const ALIGN_VALUE_SET = new Set<AlignFormat>(ALIGN_OPTIONS);
const NON_ALIGNABLE_BLOCK_TYPES = new Set(["code-block", "diagram-block", "image-block"]);

export function getBlockAlign(editor: Editor): AlignFormat {
  const [entry] = Editor.nodes(editor, {
    match: (node) => isAlignableBlock(editor, node),
  });

  if (!entry) return "left";

  const align = getNodeAlign(entry[0] as SlateElement & { align?: string });
  return align ?? "left";
}

export function isAlignActive(editor: Editor, align: AlignFormat) {
  return getBlockAlign(editor) === align;
}

export function setBlockAlign(editor: Editor, align: AlignFormat) {
  const options = {
    match: (node: unknown) => isAlignableBlock(editor, node),
    split: true,
  };

  if (align === "left") {
    Transforms.unsetNodes(editor, "align", options);
    return;
  }

  Transforms.setNodes(editor, { align } as unknown as Partial<SlateElement>, options);
}

function isAlignableBlock(editor: Editor, node: unknown): node is SlateElement & { type?: string } {
  if (!SlateElement.isElement(node)) return false;
  if (!Editor.isBlock(editor, node)) return false;

  const type = (node as SlateElement & { type?: string }).type;
  return !NON_ALIGNABLE_BLOCK_TYPES.has(type ?? "paragraph");
}

function getNodeAlign(node: SlateElement & { align?: string }) {
  const value = node.align;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase() as AlignFormat;
  if (!ALIGN_VALUE_SET.has(normalized)) return null;
  return normalized;
}
