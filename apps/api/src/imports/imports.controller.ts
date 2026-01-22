import {
  Body,
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { ImportRequest } from './imports.types';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  private static readonly MAX_FILE_SIZE_BYTES = Number(
    process.env.IMPORT_MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024,
  );

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: ImportsController.MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: ImportRequest,
    @UploadedFile()
    file: { buffer?: Buffer; path?: string; originalname?: string } | undefined,
  ) {
    const actor = userId?.trim() || 'system';

    if (!file) {
      throw new BadRequestException('file is required');
    }

    const task = await this.importsService.createImportTask(
      tenantId,
      actor,
      body,
      file.originalname,
    );

    const format = String(body?.format ?? 'markdown').toLowerCase();
    if (format === 'markdown') {
      this.importsService.startMarkdownImport({
        tenantId,
        userId: actor,
        taskId: task.id,
        req: body,
        file,
      });
    } else if (format === 'pdf') {
      this.importsService.startPdfImport({
        tenantId,
        userId: actor,
        taskId: task.id,
        req: body,
        file,
      });
    } else if (format === 'docx') {
      this.importsService.startDocxImport({
        tenantId,
        userId: actor,
        taskId: task.id,
        req: body,
        file,
      });
    } else {
      throw new BadRequestException('format not supported');
    }

    return { ok: true, taskId: task.id };
  }
}
