import {
  Editor,
  Element as SlateElement,
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

export function getLinkMark(editor: Editor) {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  const value = marks?.[LINK_MARK];

  if (typeof value !== "string") return null;
  return normalizeLinkUrl(value);
}

type LinkTextNode = Text & Record<string, unknown>;

export function getLinkAtSelection(
  editor: Editor,
  selection: BaseRange | null | undefined = editor.selection,
) {
  if (!selection) return null;

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

export function normalizeLinkUrl(input: string) {
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

  if (Range.isExpanded(editor.selection)) {
    Transforms.delete(editor);
  }

  Editor.addMark(editor, LINK_MARK, normalizedUrl);
  Editor.addMark(editor, PLUGIN_SCOPE_MARK, PLUGIN_SCOPE_INLINE);
  Editor.addMark(editor, PLUGIN_KIND_MARK, LINK_MARK);
  Transforms.insertText(editor, text);
  Editor.removeMark(editor, LINK_MARK);
  Editor.removeMark(editor, PLUGIN_SCOPE_MARK);
  Editor.removeMark(editor, PLUGIN_KIND_MARK);

  return normalizedUrl;
}

export function removeLinkMark(editor: Editor, selection: BaseRange | null | undefined) {
  if (!selection) return;

  Transforms.unsetNodes(editor, LINK_MARK, {
    at: selection,
    match: Text.isText,
    split: true,
  });
  Transforms.unsetNodes(editor, PLUGIN_SCOPE_MARK, {
    at: selection,
    match: Text.isText,
    split: true,
  });
  Transforms.unsetNodes(editor, PLUGIN_KIND_MARK, {
    at: selection,
    match: Text.isText,
    split: true,
  });
}
