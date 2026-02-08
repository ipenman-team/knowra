import { ImportsService } from '../../imports.service';
import { TaskRuntimeService } from '../../../task/task.runtime.service';
import { TaskService } from '../../../task/task.service';
import { PageService } from '../../../page/page.service';
import * as mammoth from 'mammoth';

jest.mock('mammoth', () => ({
  convertToMarkdown: jest.fn(),
}));

describe('ImportsService docx nested lists', () => {
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

    (
      mammoth as unknown as { convertToMarkdown: jest.Mock }
    ).convertToMarkdown.mockResolvedValue({
      value: [
        '* 登录功能',
        '',
        '+ 用户通过手机号+密码登录',
        '+ 支持找回密码',
        '',
        '* 注册功能',
        '',
        '+ 用户通过手机号注册',
        '',
      ].join('\n'),
    });

    const service = new ImportsService(
      taskService as TaskService,
      taskRuntime as TaskRuntimeService,
      pageService as PageService,
    );

    const runner = service as unknown as {
      runDocxImport: (args: {
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

    await runner.runDocxImport({
      tenantId: 't1',
      userId: 'u1',
      taskId: 'task1',
      req: { format: 'docx', title: 'Doc', spaceId: 's1', parentId: 'p1' },
      file: { buffer: Buffer.from('PKfake', 'utf-8'), originalname: 'x.docx' },
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

    const items = content[0]?.children as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    const firstItem = items[0];
    const nested = (firstItem?.children as unknown[]).find((c) => {
      if (!c || typeof c !== 'object') return false;
      const rec = c as Record<string, unknown>;
      return rec.type === 'bulleted-list' && Array.isArray(rec.children);
    });
    expect(nested).toBeTruthy();
  });
});
