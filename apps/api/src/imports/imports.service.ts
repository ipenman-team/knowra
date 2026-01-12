import { BadRequestException, Injectable } from '@nestjs/common';
import { TaskStatus, TaskType } from '@prisma/client';
import { PageService } from '../page/page.service';
import { TaskRuntimeService } from '../task/task.runtime.service';
import { TaskService } from '../task/task.service';
import { fileNameToTitle, markdownToSlateValue, parseParentIds } from './imports.utils';
import type { ImportRequest } from './imports.types';
import * as fs from 'node:fs/promises';

type UploadedFile = {
  buffer?: Buffer;
  path?: string;
  originalname?: string;
};

@Injectable()
export class ImportsService {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskRuntime: TaskRuntimeService,
    private readonly pageService: PageService,
  ) {}

  async createImportTask(tenantId: string, userId: string, req: ImportRequest, fileName?: string) {
    const format = (req.format ?? 'markdown').toLowerCase();
    if (format !== 'markdown') throw new BadRequestException('format not supported');

    return this.taskService.create(tenantId, userId, {
      type: TaskType.IMPORT,
      payload: {
        format,
        fileName,
      },
    });
  }

  startMarkdownImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    void this.runMarkdownImport(args);
  }

  private async runMarkdownImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    const controller = new AbortController();
    this.taskRuntime.registerAbortController(args.taskId, controller);

    try {
      await this.taskService.markRunning(args.tenantId, args.taskId, 'Reading file');

      if (controller.signal.aborted) {
        await this.taskService.cancel(args.tenantId, args.taskId, args.userId, 'Cancelled');
        return;
      }

      const markdown = await this.readFileText(args.file);
      await this.taskService.updateProgress(args.tenantId, args.taskId, 30, 'Parsing markdown');

      const content = markdownToSlateValue(markdown);
      const parentIds = parseParentIds(args.req.parentIds);
      const title = (args.req.title?.trim() || fileNameToTitle(args.file.originalname)).trim();

      if (controller.signal.aborted) {
        await this.taskService.cancel(args.tenantId, args.taskId, args.userId, 'Cancelled');
        return;
      }

      await this.taskService.updateProgress(args.tenantId, args.taskId, 70, 'Creating page');

      const created = await this.pageService.create(
        args.tenantId,
        {
          title,
          content,
          parentIds,
        },
        args.userId,
      );

      await this.taskService.succeed(
        args.tenantId,
        args.taskId,
        { pageId: created.id },
        'Completed',
      );
    } catch (error) {
      // If task already cancelled, keep cancelled.
      try {
        const task = await this.taskService.get(args.tenantId, args.taskId);
        if (task.status === TaskStatus.CANCELLED) return;
      } catch {
        // ignore
      }

      await this.taskService.fail(args.tenantId, args.taskId, error, 'Failed');
    } finally {
      this.taskRuntime.unregisterAbortController(args.taskId);
    }
  }

  private async readFileText(file: UploadedFile): Promise<string> {
    if (file.buffer) return file.buffer.toString('utf-8');
    if (file.path) return fs.readFile(file.path, 'utf-8');
    throw new BadRequestException('file content is empty');
  }
}
