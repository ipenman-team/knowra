import { BadRequestException } from '@nestjs/common';
import * as path from 'node:path';

export function fileNameToTitle(originalName: string | undefined): string {
  const base = (originalName ?? '').trim();
  if (!base) return 'Untitled';

  const parsed = path.parse(base);
  return (parsed.name || base).trim() || 'Untitled';
}

export function parseSpaceId(input: unknown): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed) return trimmed;
  }

  throw new BadRequestException('spaceId is required');
}

export function parseParentIds(input: unknown): string[] {
  if (input == null) return [];

  if (Array.isArray(input)) {
    return input.map((x) => String(x).trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Prefer JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseParentIds(parsed);
      } catch {
        // fallthrough
      }
    }

    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  throw new BadRequestException('invalid parentIds');
}

function normalizeDocxUnindentedListLevels(markdown: string): string {
  const lines = String(markdown ?? '').split('\n');
  const out: string[] = [];

  const bulletRe = /^([*+-])\s+(.*)$/;
  const orderedRe = /^(\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)]\s+(.*)$/;

  const isRoman = (s: string) => /^[ivxlcdm]+$/i.test(s);

  const orderedLevelType = (
    marker: string,
  ): 'digit' | 'alpha' | 'roman' | 'other' => {
    if (/^\d+$/.test(marker)) return 'digit';
    if (/^[a-zA-Z]$/.test(marker)) return 'alpha';
    if (isRoman(marker)) return 'roman';
    return 'other';
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    const bullet = line.match(bulletRe);
    const ordered = line.match(orderedRe);
    if (!bullet && !ordered) {
      out.push(line);
      i += 1;
      continue;
    }

    const run: Array<
      | { kind: 'bullet'; marker: string; text: string }
      | { kind: 'ordered'; marker: string; text: string }
    > = [];

    while (i < lines.length) {
      const current = lines[i] ?? '';

      if (!String(current).trim()) {
        let j = i + 1;
        while (j < lines.length && !String(lines[j] ?? '').trim()) j += 1;
        const peek = j < lines.length ? (lines[j] ?? '') : '';
        if (bulletRe.test(peek) || orderedRe.test(peek)) {
          i += 1;
          continue;
        }
        break;
      }

      const b = current.match(bulletRe);
      if (b) {
        run.push({
          kind: 'bullet',
          marker: b[1] ?? '-',
          text: String(b[2] ?? ''),
        });
        i += 1;
        continue;
      }

      const o = current.match(orderedRe);
      if (o) {
        run.push({
          kind: 'ordered',
          marker: o[1] ?? '1',
          text: String(o[2] ?? ''),
        });
        i += 1;
        continue;
      }

      break;
    }

    const hasBullet = run.some((r) => r.kind === 'bullet');
    const hasOrdered = run.some((r) => r.kind === 'ordered');

    if (hasBullet && !hasOrdered) {
      const markerOrder: string[] = [];
      const markerLevel = new Map<string, number>();
      for (const r of run) {
        if (r.kind !== 'bullet') continue;
        if (!markerLevel.has(r.marker)) {
          markerLevel.set(r.marker, markerOrder.length);
          markerOrder.push(r.marker);
        }
      }

      if (markerOrder.length <= 1) {
        for (const r of run) {
          if (r.kind !== 'bullet') continue;
          out.push(`- ${r.text}`.trimEnd());
        }
        continue;
      }

      for (const r of run) {
        if (r.kind !== 'bullet') continue;
        const level = markerLevel.get(r.marker) ?? 0;
        out.push(`${'  '.repeat(level)}- ${r.text}`.trimEnd());
      }
      continue;
    }

    if (hasOrdered && !hasBullet) {
      const typeOrder: Array<'digit' | 'alpha' | 'roman' | 'other'> = [];
      const typeLevel = new Map<string, number>();
      for (const r of run) {
        if (r.kind !== 'ordered') continue;
        const t = orderedLevelType(r.marker);
        if (!typeLevel.has(t)) {
          typeLevel.set(t, typeOrder.length);
          typeOrder.push(t);
        }
      }

      if (typeOrder.length <= 1) {
        for (const r of run) {
          if (r.kind !== 'ordered') continue;
          out.push(`1. ${r.text}`.trimEnd());
        }
        continue;
      }

      for (const r of run) {
        if (r.kind !== 'ordered') continue;
        const level = typeLevel.get(orderedLevelType(r.marker)) ?? 0;
        out.push(`${'  '.repeat(level)}1. ${r.text}`.trimEnd());
      }
      continue;
    }

    for (const r of run) {
      if (r.kind === 'bullet') out.push(`- ${r.text}`.trimEnd());
      else out.push(`1. ${r.text}`.trimEnd());
    }
  }

  return out.join('\n');
}

export function normalizeDocxMarkdown(input: string): string {
  const normalized = String(input ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalized.split('\n').map((line) => {
    const match = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (!match) return line;
    const depth = match[1].length;
    const text = (match[2] ?? '').trimEnd();
    if (depth <= 1) return `# ${text}`;
    return `## ${text}`;
  });

  let out = lines.join('\n');
  out = out.replace(/!\[[^\]]*]\([^)]*\)/g, '');
  out = out.replace(/<(?!\/?(?:u|ins)\b)[^>]+>/gi, '');
  out = normalizeDocxUnindentedListLevels(out);
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.trim();

  return out ? `${out}\n` : '';
}
