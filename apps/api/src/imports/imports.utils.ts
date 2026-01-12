import { BadRequestException } from '@nestjs/common';
import * as path from 'node:path';

export function fileNameToTitle(originalName: string | undefined): string {
  const base = (originalName ?? '').trim();
  if (!base) return 'Untitled';

  const parsed = path.parse(base);
  return (parsed.name || base).trim() || 'Untitled';
}

export function parseParentIds(input: unknown): string[] {
  if (input == null) return [];

  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Prefer JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
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

export function markdownToSlateValue(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  return lines.map((line) => ({
    type: 'paragraph',
    children: [{ text: line }],
  }));
}
