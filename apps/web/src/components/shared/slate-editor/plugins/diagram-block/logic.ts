import { Descendant, Editor, Element as SlateElement, Path, Transforms } from "slate";

import { ensureTrailingEmptyParagraph } from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK, type PluginMarkerFields } from "../types";

export const DIAGRAM_BLOCK_TYPE = "diagram-block";
export const DEFAULT_DIAGRAM_ENGINE = "mermaid";
export const DEFAULT_DIAGRAM_TEMPLATE_ID = "flow-basic";

export const DIAGRAM_ENGINE_OPTIONS = [{ value: "mermaid", label: "Mermaid" }] as const;

export const DIAGRAM_TEMPLATES = [
  {
    id: "flow-basic",
    label: "流程图",
    code: `flowchart TD
    A[开始] --> B{是否继续?}
    B -->|是| C[执行]
    C --> D[结束]
    B -->|否| D`,
  },
  {
    id: "sequence-basic",
    label: "时序图",
    code: `sequenceDiagram
    participant 用户
    participant 系统
    用户->>系统: 提交请求
    系统-->>用户: 返回结果`,
  },
  {
    id: "state-basic",
    label: "状态图",
    code: `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中
    处理中 --> 已完成
    处理中 --> 已取消
    已完成 --> [*]
    已取消 --> [*]`,
  },
  {
    id: "gantt-basic",
    label: "甘特图",
    code: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 阶段一
    需求分析: done, a1, 2026-02-10, 4d
    开发实现: active, a2, after a1, 6d
    section 阶段二
    联调测试: a3, after a2, 5d`,
  },
  {
    id: "mindmap-basic",
    label: "思维导图",
    code: `mindmap
  root((主题))
    目标
      用户价值
      业务增长
    方案
      产品
      技术
    风险
      进度
      质量`,
  },
] as const;

const DIAGRAM_ENGINE_VALUE_SET = new Set(DIAGRAM_ENGINE_OPTIONS.map((item) => item.value));
const DIAGRAM_TEMPLATE_MAP = new Map(DIAGRAM_TEMPLATES.map((template) => [template.id, template]));

export type DiagramEngine = (typeof DIAGRAM_ENGINE_OPTIONS)[number]["value"];
export type DiagramTemplateId = (typeof DIAGRAM_TEMPLATES)[number]["id"];

export type DiagramBlockElement = SlateElement & {
  type: typeof DIAGRAM_BLOCK_TYPE;
  pluginScope?: PluginMarkerFields["pluginScope"];
  pluginKind?: string;
  engine?: string;
  templateId?: string;
  code?: string;
  preview?: boolean;
  lineNumbers?: boolean;
  children: Descendant[];
};

type DiagramBlockPatch = {
  engine?: DiagramEngine;
  templateId?: DiagramTemplateId;
  code?: string;
  preview?: boolean;
  lineNumbers?: boolean;
};

export function withDiagramBlock<T extends Editor>(editor: T): T {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    if (isDiagramBlockElement(element)) return true;
    return isVoid(element);
  };

  return editor;
}

export function isDiagramBlockElement(node: unknown): node is DiagramBlockElement {
  return (
    SlateElement.isElement(node) &&
    (node as SlateElement & { type?: string }).type === DIAGRAM_BLOCK_TYPE
  );
}

export function isDiagramBlockActive(editor: Editor) {
  const [entry] = Editor.nodes(editor, {
    match: (node) => isDiagramBlockElement(node),
  });
  return Boolean(entry);
}

export function insertDiagramBlock(editor: Editor) {
  const blockEntry = Editor.above(editor, {
    match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
  });

  const at = blockEntry ? Path.next(blockEntry[1]) : [editor.children.length];
  const defaultTemplate = getDiagramTemplate(DEFAULT_DIAGRAM_TEMPLATE_ID);

  Transforms.insertNodes(
    editor,
    {
      type: DIAGRAM_BLOCK_TYPE,
      pluginScope: PLUGIN_SCOPE_BLOCK,
      pluginKind: DIAGRAM_BLOCK_TYPE,
      engine: DEFAULT_DIAGRAM_ENGINE,
      templateId: defaultTemplate.id,
      code: defaultTemplate.code,
      preview: true,
      lineNumbers: false,
      children: [{ text: "" }],
    } as unknown as DiagramBlockElement,
    { at, select: true },
  );
  ensureTrailingEmptyParagraph(editor);
}

export function updateDiagramBlock(editor: Editor, path: Path, patch: DiagramBlockPatch) {
  Transforms.setNodes(editor, patch as unknown as Partial<SlateElement>, { at: path });
}

export function removeDiagramBlock(editor: Editor, path: Path) {
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

export function getDiagramEngine(value?: string): DiagramEngine {
  if (value && DIAGRAM_ENGINE_VALUE_SET.has(value as DiagramEngine)) return value as DiagramEngine;
  return DEFAULT_DIAGRAM_ENGINE;
}

export function getDiagramTemplate(templateId?: string) {
  const defaultTemplate = DIAGRAM_TEMPLATE_MAP.get(DEFAULT_DIAGRAM_TEMPLATE_ID)!;
  if (!templateId) return defaultTemplate;
  return DIAGRAM_TEMPLATE_MAP.get(templateId as DiagramTemplateId) ?? defaultTemplate;
}

export function getDiagramTemplateId(templateId?: string): DiagramTemplateId {
  return getDiagramTemplate(templateId).id;
}

export function getDiagramCode(code?: string, templateId?: string) {
  if (typeof code === "string") return code;
  return getDiagramTemplate(templateId).code;
}

export function getDiagramPreview(value?: boolean) {
  return Boolean(value ?? true);
}

export function getDiagramLineNumbers(value?: boolean) {
  return Boolean(value ?? false);
}
