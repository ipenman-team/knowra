import { BadRequestException, Injectable } from '@nestjs/common';
import { TaskStatus, TaskType } from '@prisma/client';
import { PageService } from '../page/page.service';
import { TaskRuntimeService } from '../task/task.runtime.service';
import { TaskService } from '../task/task.service';
import {
  markdownToSlateValue,
  pdfPagesToMarkdown,
} from '@contexta/slate-converters';
import {
  fileNameToTitle,
  normalizeDocxMarkdown,
  parseParentIds,
  parseSpaceId,
} from './imports.utils';
import type { ImportRequest } from './imports.types';
import * as fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

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

  async createImportTask(
    tenantId: string,
    userId: string,
    req: ImportRequest,
    fileName?: string,
  ) {
    const format = (req.format ?? 'markdown').toLowerCase();
    if (format !== 'markdown' && format !== 'pdf' && format !== 'docx') {
      throw new BadRequestException('format not supported');
    }
    parseSpaceId(req.spaceId);

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

  startPdfImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    void this.runPdfImport(args);
  }

  startDocxImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    void this.runDocxImport(args);
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
      await this.taskService.markRunning(
        args.tenantId,
        args.taskId,
        'Reading file',
      );

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      const markdown = await this.readFileText(args.file);
      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        30,
        'Parsing markdown',
      );

      const content = markdownToSlateValue(markdown);
      const parentIds = parseParentIds(args.req.parentId ?? args.req.parentIds);
      const title = (
        args.req.title?.trim() || fileNameToTitle(args.file.originalname)
      ).trim();
      const spaceId = parseSpaceId(args.req.spaceId);
      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        70,
        'Creating page',
      );

      const created = await this.pageService.create(
        args.tenantId,
        {
          spaceId,
          title,
          content,
          parentIds,
        },
        args.userId,
      );

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        90,
        'Publishing page',
      );
      const published = await this.pageService.publish(
        args.tenantId,
        created.id,
        args.userId,
      );

      await this.taskService.succeed(
        args.tenantId,
        args.taskId,
        { pageId: created.id, versionId: published.versionId },
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

  private async runPdfImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    const controller = new AbortController();
    this.taskRuntime.registerAbortController(args.taskId, controller);

    try {
      await this.taskService.markRunning(
        args.tenantId,
        args.taskId,
        'Reading file',
      );

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      const pdfBuffer = await this.readFileBuffer(args.file);
      if (!ImportsService.looksLikePdf(pdfBuffer)) {
        throw new BadRequestException('invalid pdf');
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        20,
        'Parsing PDF',
      );

      const parser = new PDFParse({ data: pdfBuffer });
      let pages: string[] = [];
      try {
        const textResult = await parser.getText();
        pages = (textResult.pages ?? []).map((p) => p.text ?? '');
      } finally {
        try {
          await parser.destroy();
        } catch {
          // ignore
        }
      }

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      const markdown = pdfPagesToMarkdown(pages);
      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        60,
        'Parsing markdown',
      );

      const content = markdownToSlateValue(markdown);
      const parentIds = parseParentIds(args.req.parentId ?? args.req.parentIds);
      const title = (
        args.req.title?.trim() || fileNameToTitle(args.file.originalname)
      ).trim();
      const spaceId = parseSpaceId(args.req.spaceId);

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        85,
        'Creating page',
      );

      const created = await this.pageService.create(
        args.tenantId,
        {
          spaceId,
          title,
          content,
          parentIds,
        },
        args.userId,
      );

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        95,
        'Publishing page',
      );
      const published = await this.pageService.publish(
        args.tenantId,
        created.id,
        args.userId,
      );

      await this.taskService.succeed(
        args.tenantId,
        args.taskId,
        { pageId: created.id, versionId: published.versionId },
        'Completed',
      );
    } catch (error) {
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

  private async runDocxImport(args: {
    tenantId: string;
    userId: string;
    taskId: string;
    req: ImportRequest;
    file: UploadedFile;
  }) {
    const controller = new AbortController();
    this.taskRuntime.registerAbortController(args.taskId, controller);

    try {
      await this.taskService.markRunning(
        args.tenantId,
        args.taskId,
        'Reading file',
      );

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      const docxBuffer = await this.readFileBuffer(args.file);
      const name = String(args.file.originalname ?? '').trim();
      if (!ImportsService.looksLikeDocx(docxBuffer) || !/\.docx$/i.test(name)) {
        throw new BadRequestException('invalid docx');
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        30,
        'Parsing DOCX',
      );

      const result = await (
        mammoth as unknown as {
          convertToMarkdown: (input: {
            buffer: Buffer;
          }) => Promise<{ value: string }>;
        }
      ).convertToMarkdown({
        buffer: docxBuffer,
      });
      const markdown = normalizeDocxMarkdown(result.value);
      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        55,
        'Building markdown',
      );

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        70,
        'Parsing markdown',
      );

      const content = markdownToSlateValue(markdown);
      const parentIds = parseParentIds(args.req.parentId ?? args.req.parentIds);
      const title = (
        args.req.title?.trim() || fileNameToTitle(args.file.originalname)
      ).trim();
      const spaceId = parseSpaceId(args.req.spaceId);

      if (controller.signal.aborted) {
        await this.taskService.cancel(
          args.tenantId,
          args.taskId,
          args.userId,
          'Cancelled',
        );
        return;
      }

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        85,
        'Creating page',
      );

      const created = await this.pageService.create(
        args.tenantId,
        {
          spaceId,
          title,
          content,
          parentIds,
        },
        args.userId,
      );

      await this.taskService.updateProgress(
        args.tenantId,
        args.taskId,
        95,
        'Publishing page',
      );
      const published = await this.pageService.publish(
        args.tenantId,
        created.id,
        args.userId,
      );

      await this.taskService.succeed(
        args.tenantId,
        args.taskId,
        { pageId: created.id, versionId: published.versionId },
        'Completed',
      );
    } catch (error) {
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
    if (file.path) {
      try {
        return await fs.readFile(file.path, 'utf-8');
      } finally {
        try {
          await fs.unlink(file.path);
        } catch {
          // ignore
        }
      }
    }
    throw new BadRequestException('file content is empty');
  }

  private async readFileBuffer(file: UploadedFile): Promise<Buffer> {
    if (file.buffer) return file.buffer;
    if (file.path) {
      try {
        return await fs.readFile(file.path);
      } finally {
        try {
          await fs.unlink(file.path);
        } catch {
          // ignore
        }
      }
    }
    throw new BadRequestException('file content is empty');
  }

  private static looksLikePdf(buffer: Buffer): boolean {
    if (!buffer?.length) return false;
    if (buffer.length < 5) return false;
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  private static looksLikeDocx(buffer: Buffer): boolean {
    if (!buffer?.length) return false;
    if (buffer.length < 4) return false;
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }
}
