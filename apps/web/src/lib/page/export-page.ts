import { pagesApi } from '@/lib/api';

const INVALID_FILENAME_PATTERN = /[\\/:*?"<>|]+/g;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]+/g;

function sanitizeFilename(input: string): string {
  return input
    .replace(CONTROL_CHARS_PATTERN, '')
    .replace(INVALID_FILENAME_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
}

function downloadTextFile(
  content: string,
  filename: string,
  contentType: string,
) {
  if (typeof window === 'undefined') return;
  if (!filename) return;

  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportPageAsMarkdown(params: {
  spaceId: string;
  pageId: string;
  title?: string | null;
}) {
  const content = await pagesApi.exportPage(params.spaceId, params.pageId, {
    format: 'markdown',
  });

  const fallbackTitle = '无标题文档';
  const rawTitle = params.title?.trim() ?? '';
  const safeTitle = sanitizeFilename(rawTitle) || fallbackTitle;
  const filename = `${safeTitle}.md`;

  downloadTextFile(content, filename, 'text/markdown;charset=utf-8');
}
