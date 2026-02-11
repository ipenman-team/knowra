import type { PageExportRepository } from '@contexta/domain';
import { slateToMarkdown } from '@contexta/slate-converters';

function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export class ExportPageUseCase {
  constructor(private readonly repo: PageExportRepository) { }

  async export(params: {
    tenantId: string;
    userId?: string | null;
    spaceId: string;
    pageId: string;
    format: 'markdown';
  }): Promise<{ content: string; contentType: 'text/markdown' } | null> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const pageId = normalizeRequiredText('pageId', params.pageId);

    const format = params.format;
    if (format !== 'markdown') throw new Error('format not supported');

    const page = await this.repo.getForExport({ tenantId, pageId });
    if (!page) return null;
    if (page.spaceId !== spaceId) return null;

    const content = slateToMarkdown(page.content ?? []);

    return {
      content,
      contentType: 'text/markdown',
    };
  }
}
