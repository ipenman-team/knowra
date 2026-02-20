import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { InternalNotificationClient } from './internal-notification.client';

@Module({
  imports: [PrismaModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, InternalNotificationClient],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
