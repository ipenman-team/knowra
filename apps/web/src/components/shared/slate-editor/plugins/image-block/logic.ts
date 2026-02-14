import { Descendant, Editor, Element as SlateElement, Path, Transforms } from "slate";

import { PLUGIN_SCOPE_BLOCK, type PluginMarkerFields } from "../types";

export const IMAGE_BLOCK_TYPE = "image-block";

export type ImageBlockElement = SlateElement & {
  type: typeof IMAGE_BLOCK_TYPE;
  pluginScope?: PluginMarkerFields["pluginScope"];
  pluginKind?: string;
  url?: string;
  alt?: string;
  children: Descendant[];
};

type InsertImageInput = {
  url: string;
  alt?: string;
};

export function withImageBlock<T extends Editor>(editor: T): T {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    if (isImageBlockElement(element)) return true;
    return isVoid(element);
  };

  return editor;
}

export function isImageBlockElement(node: unknown): node is ImageBlockElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === IMAGE_BLOCK_TYPE
  );
}

export function isImageBlockActive(editor: Editor) {
  const [entry] = Editor.nodes(editor, {
    match: (node) => isImageBlockElement(node),
  });
  return Boolean(entry);
}

export function insertImageBlock(editor: Editor, input: InsertImageInput) {
  if (!input.url.trim()) return;

  const blockEntry = Editor.above(editor, {
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });

  const at = blockEntry ? Path.next(blockEntry[1]) : [editor.children.length];

  Transforms.insertNodes(
    editor,
    {
      type: IMAGE_BLOCK_TYPE,
      pluginScope: PLUGIN_SCOPE_BLOCK,
      pluginKind: IMAGE_BLOCK_TYPE,
      url: input.url,
      alt: input.alt,
      children: [{ text: "" }],
    } as unknown as ImageBlockElement,
    { at, select: true },
  );
}

export function removeImageBlock(editor: Editor, path: Path) {
  Transforms.removeNodes(editor, { at: path });

  if (editor.children.length > 0) return;

  Transforms.insertNodes(
    editor,
    {
      type: "paragraph",
      children: [{ text: "" }],
    } as unknown as SlateElement,
    { at: [0], select: true },
  );
}

export function getImageBlockUrl(value?: string) {
  return typeof value === "string" ? value : "";
}

export function getImageBlockAlt(value?: string) {
  return typeof value === "string" ? value : "";
}

export function getFirstImageFileFromClipboard(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) return null;

  const items = Array.from(dataTransfer.items ?? []);

  for (const item of items) {
    if (item.kind !== "file") continue;
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) return file;
  }

  const files = Array.from(dataTransfer.files ?? []);
  for (const file of files) {
    if (file.type.startsWith("image/")) return file;
  }

  return null;
}
