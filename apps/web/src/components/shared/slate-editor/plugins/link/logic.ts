import {
  Descendant,
  Editor,
  Element as SlateElement,
  NodeEntry,
  Path,
  Range,
  Text,
  Transforms,
  type BaseRange,
} from "slate";

import { PLUGIN_SCOPE_INLINE } from "../types";

export const LINK_MARK = "link";
export const PLUGIN_SCOPE_MARK = "pluginScope";
export const PLUGIN_KIND_MARK = "pluginKind";
export const DEFAULT_LINK_PLACEHOLDER_TEXT = "链接";
export const DEFAULT_LINK_PLACEHOLDER_URL = "http://";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export type LinkElement = SlateElement & {
  type: typeof LINK_MARK;
  url: string;
  children: Descendant[];
  pluginScope?: string;
  pluginKind?: string;
};

type LinkTextNode = Text & Record<string, unknown>;

function createLinkElement(url: string, text: string): LinkElement {
  return {
    type: LINK_MARK,
    url,
    pluginScope: PLUGIN_SCOPE_INLINE,
    pluginKind: LINK_MARK,
    children: [{ text }],
  };
}

export function isLinkElement(node: unknown): node is LinkElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === LINK_MARK
  );
}

export function withLink<T extends Editor>(editor: T): T {
  const { isInline } = editor;

  editor.isInline = (element) => {
    if (isLinkElement(element)) return true;
    return isInline(element);
  };

  return editor;
}

export function getLinkEntry(
  editor: Editor,
  selection: BaseRange | null | undefined = editor.selection,
): NodeEntry<LinkElement> | null {
  if (!selection) return null;

  const point = Range.isCollapsed(selection) ? selection.anchor : selection.focus;
  const entry = Editor.above(editor, {
    at: point,
    match: (node) => isLinkElement(node),
  });

  return (entry as NodeEntry<LinkElement> | undefined) ?? null;
}

export function getLinkMark(editor: Editor) {
  const linkEntry = getLinkEntry(editor);
  if (linkEntry) return normalizeLinkUrl(linkEntry[0].url);

  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  const value = marks?.[LINK_MARK];

  if (typeof value !== "string") return null;
  return normalizeLinkUrl(value);
}

export function getLinkAtSelection(
  editor: Editor,
  selection: BaseRange | null | undefined = editor.selection,
) {
  if (!selection) return null;

  const linkEntry = getLinkEntry(editor, selection);
  if (linkEntry) {
    const [linkNode, path] = linkEntry;
    const normalizedUrl = normalizeLinkUrl(linkNode.url);
    if (!normalizedUrl) return null;

    return {
      url: normalizedUrl,
      text: Editor.string(editor, path),
      range: Editor.range(editor, path),
    };
  }

  const point = Range.isCollapsed(selection) ? selection.anchor : selection.focus;

  let textEntry: [Text, Path];
  try {
    textEntry = Editor.leaf(editor, point);
  } catch {
    return null;
  }

  const [textNode, textPath] = textEntry;
  const link = normalizeLinkUrl((textNode as LinkTextNode)[LINK_MARK] as string);
  if (!link) return null;

  const blockEntry = Editor.above(editor, {
    at: textPath,
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });
  const blockPath = blockEntry?.[1] ?? null;

  let start = Editor.start(editor, textPath);
  let end = Editor.end(editor, textPath);

  let pointerPath = textPath;
  while (true) {
    const prevEntry = Editor.previous(editor, {
      at: pointerPath,
      match: Text.isText,
    }) as [Text, Path] | undefined;
    if (!prevEntry) break;

    const [prevNode, prevPath] = prevEntry;
    if (blockPath && !Path.isDescendant(prevPath, blockPath)) break;

    const prevLink = normalizeLinkUrl((prevNode as LinkTextNode)[LINK_MARK] as string);
    if (prevLink !== link) break;

    start = Editor.start(editor, prevPath);
    pointerPath = prevPath;
  }

  pointerPath = textPath;
  while (true) {
    const nextEntry = Editor.next(editor, {
      at: pointerPath,
      match: Text.isText,
    }) as [Text, Path] | undefined;
    if (!nextEntry) break;

    const [nextNode, nextPath] = nextEntry;
    if (blockPath && !Path.isDescendant(nextPath, blockPath)) break;

    const nextLink = normalizeLinkUrl((nextNode as LinkTextNode)[LINK_MARK] as string);
    if (nextLink !== link) break;

    end = Editor.end(editor, nextPath);
    pointerPath = nextPath;
  }

  const range = { anchor: start, focus: end };

  return {
    url: link,
    text: Editor.string(editor, range),
    range,
  };
}

export function getSelectionText(editor: Editor, selection: BaseRange | null | undefined) {
  if (!selection || !Range.isExpanded(selection)) return "";

  try {
    return Editor.string(editor, selection);
  } catch {
    return "";
  }
}

export function normalizeLinkUrl(input: unknown) {
  if (typeof input !== "string") return null;

  const value = input.trim();
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (!HTTP_PROTOCOLS.has(parsed.protocol)) return null;
    if (!parsed.hostname) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function insertLinkText(editor: Editor, payload: {
  text: string;
  url: string;
  selection?: BaseRange | null;
}) {
  const normalizedUrl = normalizeLinkUrl(payload.url);
  if (!normalizedUrl) return null;

  const text = payload.text.trim();
  if (!text) return null;

  if (payload.selection) {
    try {
      Transforms.select(editor, payload.selection);
    } catch {
      // ignore invalid selection
    }
  }

  if (!editor.selection) return null;

  Transforms.unwrapNodes(editor, {
    at: editor.selection,
    match: isLinkElement,
    split: true,
  });

  if (Range.isExpanded(editor.selection)) {
    Transforms.delete(editor);
  }

  Transforms.insertNodes(editor, createLinkElement(normalizedUrl, text));

  return normalizedUrl;
}

export function removeLinkMark(editor: Editor, selection: BaseRange | null | undefined) {
  if (selection) {
    try {
      Transforms.select(editor, selection);
    } catch {
      // ignore invalid selection
    }
  }

  if (!editor.selection) return;

  Transforms.unwrapNodes(editor, {
    at: editor.selection,
    match: isLinkElement,
    split: true,
  });

  Transforms.unsetNodes(editor, LINK_MARK, {
    at: editor.selection,
    match: Text.isText,
    split: true,
  });
  Transforms.unsetNodes(editor, PLUGIN_SCOPE_MARK, {
    at: editor.selection,
    match: Text.isText,
    split: true,
  });
  Transforms.unsetNodes(editor, PLUGIN_KIND_MARK, {
    at: editor.selection,
    match: Text.isText,
    split: true,
  });
}
