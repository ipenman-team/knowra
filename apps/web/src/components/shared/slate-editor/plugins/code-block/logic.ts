import { Descendant, Editor, Element as SlateElement, Path, Transforms } from "slate";

export const CODE_BLOCK_TYPE = "code-block";
export const DEFAULT_CODE_LANGUAGE = "javascript";
export const DEFAULT_CODE_BLOCK_HEIGHT = 320;
export const MIN_CODE_BLOCK_HEIGHT = 180;
export const MAX_CODE_BLOCK_HEIGHT = 960;

export const CODE_LANGUAGE_OPTIONS = [
  { value: "apl", label: "APL" },
  { value: "asn1", label: "ASN.1" },
  { value: "brainfuck", label: "Brainfuck" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "rust", label: "Rust" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "scala", label: "Scala" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "lua", label: "Lua" },
  { value: "perl", label: "Perl" },
  { value: "r", label: "R" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
  { value: "ini", label: "INI" },
  { value: "html", label: "HTML" },
  { value: "xml", label: "XML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "less", label: "Less" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "nginx", label: "Nginx" },
  { value: "graphql", label: "GraphQL" },
  { value: "protobuf", label: "Protocol Buffers" },
  { value: "plaintext", label: "Plain Text" },
] as const;

const CODE_LANGUAGE_VALUE_SET = new Set(CODE_LANGUAGE_OPTIONS.map((item) => item.value));

export type CodeLanguage = (typeof CODE_LANGUAGE_OPTIONS)[number]["value"];

export type CodeBlockElement = SlateElement & {
  type: typeof CODE_BLOCK_TYPE;
  language?: string;
  code?: string;
  wrap?: boolean;
  height?: number;
  children: Descendant[];
};

type CodeBlockPatch = {
  language?: CodeLanguage;
  code?: string;
  wrap?: boolean;
  height?: number;
};

export function withCodeBlock<T extends Editor>(editor: T): T {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    if (isCodeBlockElement(element)) return true;
    return isVoid(element);
  };

  return editor;
}

export function isCodeBlockElement(node: unknown): node is CodeBlockElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === CODE_BLOCK_TYPE
  );
}

export function isCodeBlockActive(editor: Editor) {
  const [entry] = Editor.nodes(editor, {
    match: (node) => isCodeBlockElement(node),
  });
  return Boolean(entry);
}

export function insertCodeBlock(editor: Editor) {
  const blockEntry = Editor.above(editor, {
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });

  const at = blockEntry ? Path.next(blockEntry[1]) : [editor.children.length];

  Transforms.insertNodes(editor, createCodeBlockElement(), { at, select: true });
}

export function updateCodeBlock(editor: Editor, path: Path, patch: CodeBlockPatch) {
  Transforms.setNodes(editor, patch as unknown as Partial<SlateElement>, { at: path });
}

export function removeCodeBlock(editor: Editor, path: Path) {
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

export function getCodeBlockLanguage(value?: string): CodeLanguage {
  if (value && CODE_LANGUAGE_VALUE_SET.has(value as CodeLanguage)) return value as CodeLanguage;
  return DEFAULT_CODE_LANGUAGE;
}

export function getCodeBlockHeight(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_CODE_BLOCK_HEIGHT;
  return Math.min(MAX_CODE_BLOCK_HEIGHT, Math.max(MIN_CODE_BLOCK_HEIGHT, value));
}

export function getCodeBlockWrap(value?: boolean) {
  return Boolean(value ?? false);
}

export function getCodeBlockCode(value?: string) {
  return typeof value === "string" ? value : "";
}

function createCodeBlockElement(): CodeBlockElement {
  return {
    type: CODE_BLOCK_TYPE,
    language: DEFAULT_CODE_LANGUAGE,
    code: "",
    wrap: false,
    height: DEFAULT_CODE_BLOCK_HEIGHT,
    children: [{ text: "" }],
  } as unknown as CodeBlockElement;
}
