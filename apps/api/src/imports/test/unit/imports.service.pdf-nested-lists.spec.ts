import { ImportsService } from '../../imports.service';
import { TaskRuntimeService } from '../../../task/task.runtime.service';
import { TaskService } from '../../../task/task.service';
import { PageService } from '../../../page/page.service';
import { PDFParse } from 'pdf-parse';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

describe('ImportsService pdf nested lists', () => {
  it('creates page content with nested list nodes', async () => {
    const taskService: Partial<Record<keyof TaskService, unknown>> = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      updateProgress: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn().mockResolvedValue(undefined),
      succeed: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ status: 'RUNNING' }),
    };

    const taskRuntime: Partial<Record<keyof TaskRuntimeService, unknown>> = {
      registerAbortController: jest.fn(),
      unregisterAbortController: jest.fn(),
    };

    const pageService: Partial<Record<keyof PageService, unknown>> = {
      create: jest.fn().mockResolvedValue({ id: 'p1' }),
      publish: jest.fn().mockResolvedValue({ versionId: 'v1' }),
    };

    const getText = jest.fn().mockResolvedValue({
      pages: [{ text: '• A\n    • B\n        • C\n' }],
    });
    const destroy = jest.fn().mockResolvedValue(undefined);

    (PDFParse as unknown as jest.Mock).mockImplementation(() => ({
      getText,
      destroy,
    }));

    const service = new ImportsService(
      taskService as TaskService,
      taskRuntime as TaskRuntimeService,
      pageService as PageService,
    );

    const runner = service as unknown as {
      runPdfImport: (args: {
        tenantId: string;
        userId: string;
        taskId: string;
        req: {
          format: string;
          title: string;
          spaceId: string;
          parentId?: string;
          parentIds?: unknown;
        };
        file: { buffer: Buffer; originalname: string };
      }) => Promise<void>;
    };

    await runner.runPdfImport({
      tenantId: 't1',
      userId: 'u1',
      taskId: 'task1',
      req: { format: 'pdf', title: 'Doc', spaceId: 's1', parentId: 'p1' },
      file: {
        buffer: Buffer.from('%PDF-1.4 fake', 'utf-8'),
        originalname: 'x.pdf',
      },
    });

    expect(pageService.create).toHaveBeenCalledTimes(1);
    const createMock = pageService.create as jest.Mock<
      Promise<unknown>,
      [string, { content?: unknown }, string?]
    >;
    const createArgs = createMock.mock.calls[0];
    const payload = (createArgs?.[1] ?? {}) as { content?: unknown };

    expect(Array.isArray(payload.content)).toBe(true);
    const content = payload.content as Array<Record<string, unknown>>;
    expect(content[0]?.type).toBe('bulleted-list');

    const firstItem = (
      content[0]?.children as Array<Record<string, unknown>>
    )[0];
    expect(firstItem?.type).toBe('list-item');

    const nested = (firstItem?.children as unknown[]).find((c) => {
      if (!c || typeof c !== 'object') return false;
      const rec = c as Record<string, unknown>;
      return rec.type === 'bulleted-list' && Array.isArray(rec.children);
    });

    expect(nested).toBeTruthy();
  });
});
