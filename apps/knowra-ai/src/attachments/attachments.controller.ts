import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { AttachmentsService } from './attachments.service';

type AttachmentsUploadBody = {
  conversationId?: unknown;
};

@Controller('api/attachments')
export class AttachmentsController {
  private static readonly MAX_FILE_SIZE_BYTES = (() => {
    const raw = Number(process.env.KNOWRA_AI_ATTACHMENT_MAX_FILE_SIZE_BYTES);
    return Number.isFinite(raw) && raw > 0 ? raw : 10 * 1024 * 1024;
  })();
  private static readonly MAX_FILES = (() => {
    const raw = Number(process.env.KNOWRA_AI_ATTACHMENT_MAX_FILES);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 5;
  })();

  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', AttachmentsController.MAX_FILES, {
      storage: memoryStorage(),
      limits: {
        fileSize: AttachmentsController.MAX_FILE_SIZE_BYTES,
        files: AttachmentsController.MAX_FILES,
      },
    }),
  )
  async upload(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: AttachmentsUploadBody,
    @UploadedFiles()
    files:
      | Array<{
          buffer?: Buffer;
          originalname?: string;
          mimetype?: string;
          size?: number;
        }>
      | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const conversationId =
      typeof body?.conversationId === 'string' ? body.conversationId : '';
    if (!conversationId.trim()) {
      throw new BadRequestException('conversationId is required');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('files is required');
    }

    const attachments = await this.attachmentsService.uploadAttachments({
      tenantId,
      conversationId,
      actorUserId: userId,
      files,
    });

    return { ok: true, attachments };
  }
}
