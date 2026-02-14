import { Editor, Range, Transforms, type BaseRange } from "slate";

export const LINK_MARK = "link";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export function getLinkMark(editor: Editor) {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  const value = marks?.[LINK_MARK];

  if (typeof value !== "string") return null;
  return normalizeLinkUrl(value);
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
  Transforms.insertText(editor, text);
  Editor.removeMark(editor, LINK_MARK);

  return normalizedUrl;
}
