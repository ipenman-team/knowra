import {
  Body,
  BadRequestException,
  Controller,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import type { ImportRequest } from './imports.types';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @TenantId() tenantId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: ImportRequest,
    @UploadedFile() file: { buffer?: Buffer; path?: string; originalname?: string } | undefined,
  ) {
    const actor = userId?.trim() || 'system';

    if (!file) {
      throw new BadRequestException('file is required');
    }

    const task = await this.importsService.createImportTask(tenantId, actor, body, file.originalname);

    this.importsService.startMarkdownImport({
      tenantId,
      userId: actor,
      taskId: task.id,
      req: body,
      file,
    });

    return { ok: true, taskId: task.id };
  }
}
