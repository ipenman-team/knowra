import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { MAX_FILE_SIZE_BYTES } from './constant';
import { FilesService } from './files.service';
import { StorageFactory } from '../common/tenant/storage/storage.factory';
import os from 'os';
import { diskStorage } from 'multer';
import { join } from 'path';
import { unlinkSync } from 'fs';
import { Response } from '@contexta/shared';

@Controller('files')
export class FilesController {

    private readonly storage = StorageFactory.get('cos');
    constructor(private readonly filesService: FilesService) {
        this.storage?.initStorage();
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'uploads')
            }),
            limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
        }),
    )
    async upload(
        @TenantId() tenantId: string,
        @UserId() userId: string | undefined,
        @Body() body: { from: string } & Request,

        @UploadedFile()
        file: { buffer?: Buffer; path?: string; originalname?: string } | undefined
    ) {
        const result = await this.storage?.uploadFile({
            filePath: file?.path || '',
            originPath: `${body.from}/${file?.originalname}`
        });
        unlinkSync(file?.path as string);
        return new Response(result);
    }
}