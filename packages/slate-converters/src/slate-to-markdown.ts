import type { SlateElement, SlateNode, SlateText } from './types';

type MarkdownBlock = string;

type ListKind = 'numbered-list' | 'bulleted-list';

type TextNode = SlateText & { code?: boolean };

type ElementNode = SlateElement & { type: string; children: SlateNode[] };

function isTextNode(node: unknown): node is TextNode {
  return typeof (node as SlateText | undefined)?.text === 'string';
}

function isElementNode(node: unknown): node is ElementNode {
  const candidate = node as SlateElement | undefined;
  return Boolean(candidate && typeof candidate.type === 'string' && Array.isArray(candidate.children));
}

function escapeMarkdownText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/[\*_\[\]()#+\-.!>|]/g, '\\$&');
}

function escapeCodeText(text: string): string {
  return text.replace(/`/g, '\\`');
}

function serializeText(node: TextNode): string {
  const raw = node.text ?? '';
  if ((node as TextNode).code) {
    return `\`${escapeCodeText(raw)}\``;
  }

  let out = escapeMarkdownText(raw);
  if (node.bold) out = `**${out}**`;
  if (node.italic) out = `*${out}*`;
  if (node.underline) out = `<u>${out}</u>`;
  return out;
}

function serializeInline(nodes: SlateNode[] | undefined): string {
  if (!Array.isArray(nodes) || !nodes.length) return '';
  return nodes
    .map((node) => {
      if (isTextNode(node)) return serializeText(node);
      if (isElementNode(node)) return serializeInline(node.children);
      return '';
    })
    .join('');
}

function serializeParagraph(node: ElementNode): MarkdownBlock {
  return serializeInline(node.children).trimEnd();
}

function serializeHeading(node: ElementNode): MarkdownBlock {
  const type = node.type;
  const levelMap: Record<string, number> = {
    'heading-one': 1,
    'heading-two': 2,
    'heading-three': 3,
    'heading-four': 4,
    'heading-five': 5,
    'heading-six': 6,
  };
  const level = levelMap[type] ?? 2;
  const text = serializeInline(node.children).trim();
  return `${'#'.repeat(level)} ${text}`.trimEnd();
}

function serializePlainText(nodes: SlateNode[] | undefined): string {
  if (!Array.isArray(nodes) || !nodes.length) return '';
  const out: string[] = [];
  const visit = (node: SlateNode) => {
    if (isTextNode(node)) {
      out.push(node.text ?? '');
      return;
    }
    if (isElementNode(node)) {
      for (const child of node.children) visit(child);
      out.push('\n');
    }
  };
  for (const n of nodes) visit(n);
  return out.join('').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function serializeCodeBlock(node: ElementNode): MarkdownBlock {
  const content = serializePlainText(node.children);
  return ['```', content, '```'].join('\n');
}

function indentLines(text: string, depth: number): string {
  const pad = '  '.repeat(depth);
  return text
    .split('\n')
    .map((line) => (line ? `${pad}${line}` : line))
    .join('\n');
}

function serializeBlockQuote(node: ElementNode, depth: number): MarkdownBlock {
  const blocks = serializeChildrenBlocks(node.children, depth);
  return blocks
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function serializeList(node: ElementNode, depth: number, kind: ListKind): MarkdownBlock {
  const lines: string[] = [];
  let index = 1;
  for (const child of node.children) {
    if (!isElementNode(child) || child.type !== 'list-item') continue;
    lines.push(serializeListItem(child, depth, kind, index));
    index += 1;
  }
  return lines.join('\n');
}

function serializeListItem(
  item: ElementNode,
  depth: number,
  kind: ListKind,
  index: number,
): MarkdownBlock {
  const indent = '  '.repeat(depth);
  const bullet = kind === 'numbered-list' ? `${index}. ` : '- ';

  const paragraphs: string[] = [];
  const nestedBlocks: string[] = [];

  for (const child of item.children) {
    if (isElementNode(child) && child.type === 'paragraph') {
      paragraphs.push(serializeParagraph(child));
      continue;
    }
    if (isElementNode(child) && (child.type === 'numbered-list' || child.type === 'bulleted-list')) {
      nestedBlocks.push(serializeList(child, depth + 1, child.type));
      continue;
    }
    if (isTextNode(child)) {
      paragraphs.push(serializeText(child));
      continue;
    }
    if (isElementNode(child)) {
      const block = serializeBlock(child, depth + 1);
      if (block) nestedBlocks.push(indentLines(block, depth + 1));
    }
  }

  if (!paragraphs.length) paragraphs.push('');

  const lines: string[] = [];
  lines.push(`${indent}${bullet}${paragraphs[0] ?? ''}`.trimEnd());
  for (let i = 1; i < paragraphs.length; i += 1) {
    lines.push(`${indent}  ${paragraphs[i] ?? ''}`.trimEnd());
  }

  if (nestedBlocks.length) {
    lines.push(nestedBlocks.join('\n'));
  }

  return lines.join('\n');
}

function serializeChildrenBlocks(children: SlateNode[] | undefined, depth: number): string {
  if (!Array.isArray(children) || !children.length) return '';
  const blocks: string[] = [];
  for (const child of children) {
    const block = serializeBlock(child, depth);
    if (block) blocks.push(block);
  }
  return blocks.join('\n\n');
}

function serializeBlock(node: SlateNode, depth: number): MarkdownBlock {
  if (isTextNode(node)) return serializeText(node);
  if (!isElementNode(node)) return '';

  switch (node.type) {
    case 'paragraph':
      return serializeParagraph(node);
    case 'heading-one':
    case 'heading-two':
    case 'heading-three':
    case 'heading-four':
    case 'heading-five':
    case 'heading-six':
      return serializeHeading(node);
    case 'block-quote':
      return serializeBlockQuote(node, depth);
    case 'numbered-list':
    case 'bulleted-list':
      return serializeList(node, depth, node.type);
    case 'code-block':
      return serializeCodeBlock(node);
    default:
      return serializeInline(node.children);
  }
}

export function slateToMarkdown(value: unknown): string {
  const nodes: SlateNode[] = Array.isArray(value) ? value : value ? [value as SlateNode] : [];
  const blocks: string[] = [];
  for (const node of nodes) {
    const block = serializeBlock(node, 0);
    if (block) blocks.push(block);
  }
  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
