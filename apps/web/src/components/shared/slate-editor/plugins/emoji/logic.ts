import { Editor, Transforms, type BaseRange } from "slate";

export const EMOJI_OPTIONS = [
  "😀",
  "😄",
  "😁",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😭",
  "😡",
  "👍",
  "👏",
  "🙏",
  "💪",
  "🎉",
  "🔥",
  "💯",
  "✨",
  "✅",
  "❌",
  "💡",
  "📌",
  "🚀",
] as const;

export function insertEmoji(
  editor: Editor,
  emoji: string,
  selection?: BaseRange | null,
) {
  const nextEmoji = emoji.trim();
  if (!nextEmoji) return false;

  if (selection) {
    try {
      Transforms.select(editor, selection);
    } catch {
      // ignore invalid selection
    }
  }

  if (!editor.selection) {
    Transforms.select(editor, Editor.end(editor, []));
  }

  if (!editor.selection) return false;

  Transforms.insertText(editor, nextEmoji);
  return true;
}
