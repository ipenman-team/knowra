import type { SlateText, SlateValue } from './types';

type Marks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

function normalizeMarkdown(input: string): string {
  return (input ?? '').replace(/\r\n/g, '\n');
}

function ensureParagraph(children: SlateText[]): { type: 'paragraph'; children: SlateText[] } {
  return {
    type: 'paragraph',
    children: children.length ? children : [{ text: '' }],
  };
}

function applyMark(text: string, marks: Marks): SlateText[] {
  if (!text) return [{ text: '', ...marks }];
  return [{ text, ...marks }];
}

function convertInlineText(input: string, marks: Marks = {}): SlateText[] {
  const text = String(input ?? '');
  if (!text) return [{ text: '' }];

  const out: SlateText[] = [];

  const pushText = (chunk: string, nextMarks: Marks) => {
    if (chunk) out.push(...applyMark(chunk, nextMarks));
  };

  let i = 0;
  while (i < text.length) {
    const uOpen = text.slice(i).match(/^<(u|ins)>/i);
    if (uOpen) {
      const tag = uOpen[1];
      const close = new RegExp(`^</${tag}>`, 'i');
      const start = i + uOpen[0].length;
      const rest = text.slice(start);
      const closeIndex = rest.search(close);
      if (closeIndex >= 0) {
        const inner = rest.slice(0, closeIndex);
        out.push(...convertInlineText(inner, { ...marks, underline: true }));
        i = start + closeIndex + `</${tag}>`.length;
        continue;
      }
    }

    const tokenSpecs: Array<{ open: string; close: string; next: Marks }> = [
      { open: '**', close: '**', next: { ...marks, bold: true } },
      { open: '__', close: '__', next: { ...marks, bold: true } },
      { open: '*', close: '*', next: { ...marks, italic: true } },
      { open: '_', close: '_', next: { ...marks, italic: true } },
      { open: '`', close: '`', next: { ...marks } },
    ];

    let matched = false;
    for (const spec of tokenSpecs) {
      if (!text.startsWith(spec.open, i)) continue;
      const start = i + spec.open.length;
      const end = text.indexOf(spec.close, start);
      if (end === -1) continue;

      const before = text.slice(i, i);
      if (before) pushText(before, marks);

      const inner = text.slice(start, end);
      if (spec.open === '`') {
        pushText(inner, spec.next);
      } else {
        out.push(...convertInlineText(inner, spec.next));
      }

      i = end + spec.close.length;
      matched = true;
      break;
    }
    if (matched) continue;

    const nextToken = (() => {
      const candidates: number[] = [];
      const pushCandidate = (idx: number) => {
        if (idx >= 0) candidates.push(idx);
      };
      pushCandidate(text.indexOf('<u>', i));
      pushCandidate(text.indexOf('<ins>', i));
      pushCandidate(text.indexOf('**', i));
      pushCandidate(text.indexOf('__', i));
      pushCandidate(text.indexOf('*', i));
      pushCandidate(text.indexOf('_', i));
      pushCandidate(text.indexOf('`', i));
      if (candidates.length === 0) return -1;
      return Math.min(...candidates.filter((n) => n >= 0));
    })();

    if (nextToken === -1) {
      pushText(text.slice(i), marks);
      break;
    }

    pushText(text.slice(i, nextToken), marks);
    i = nextToken;
  }

  return out.length ? out : [{ text: '' }];
}

function splitLines(input: string): string[] {
  return normalizeMarkdown(input).split('\n');
}

function parseParagraphLines(lines: string[]): SlateValue {
  const text = lines.join('\n').trimEnd();
  return [ensureParagraph(convertInlineText(text))];
}

function parseBlockquoteLines(lines: string[]): SlateValue {
  const innerText = lines
    .map((l) => l.replace(/^\s*>\s?/, ''))
    .join('\n');
  const inner = markdownToSlateValue(innerText);
  return [
    {
      type: 'block-quote',
      children: inner.length ? inner : [ensureParagraph([{ text: '' }])],
    },
  ];
}

function parseList(lines: string[], ordered: boolean): SlateValue {
  const listType = ordered ? 'numbered-list' : 'bulleted-list';
  const items = lines
    .map((l) => {
      const cleaned = ordered ? l.replace(/^\s*\d+\.\s+/, '') : l.replace(/^\s*[-*+]\s+/, '');
      return {
        type: 'list-item',
        children: [ensureParagraph(convertInlineText(cleaned.trimEnd()))],
      };
    })
    .filter(Boolean);

  return [
    {
      type: listType,
      children: items.length ? items : [{ type: 'list-item', children: [ensureParagraph([{ text: '' }])] }],
    },
  ];
}

export function markdownToSlateValue(markdown: string): SlateValue {
  const lines = splitLines(markdown);
  const blocks: SlateValue = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const fence = line.trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== fence) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push(ensureParagraph([{ text: codeLines.join('\n') }]));
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      const depth = heading[1].length;
      const text = heading[2] ?? '';
      const type = depth === 1 ? 'heading-one' : 'heading-two';
      blocks.push({ type, children: convertInlineText(text.trimEnd()) });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? '')) {
        quoteLines.push(lines[i] ?? '');
        i += 1;
      }
      blocks.push(...parseBlockquoteLines(quoteLines));
      continue;
    }

    const isBullet = /^\s*[-*+]\s+/.test(line);
    const isOrdered = /^\s*\d+\.\s+/.test(line);
    if (isBullet || isOrdered) {
      const listLines: string[] = [];
      const ordered = isOrdered;
      const lineRe = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
      while (i < lines.length && lineRe.test(lines[i] ?? '')) {
        listLines.push(lines[i] ?? '');
        i += 1;
      }
      blocks.push(...parseList(listLines, ordered));
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? '';
      if (!current.trim()) break;
      if (/^\s*```/.test(current)) break;
      if (/^\s*(#{1,6})\s+/.test(current)) break;
      if (/^\s*>/.test(current)) break;
      if (/^\s*[-*+]\s+/.test(current)) break;
      if (/^\s*\d+\.\s+/.test(current)) break;
      paraLines.push(current);
      i += 1;
    }
    blocks.push(...parseParagraphLines(paraLines));
  }

  return blocks.length ? blocks : [ensureParagraph([{ text: '' }])];
}
