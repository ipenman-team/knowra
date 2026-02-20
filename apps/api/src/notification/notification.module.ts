import { Module } from '@nestjs/common';
import {
  DeleteNotificationUseCase,
  GetUnreadNotificationCountUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  SendNotificationUseCase,
} from '@knowra/application';
import { PrismaNotificationRepository } from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { InternalNotificationController } from './internal-notification.controller';
import { NotificationController } from './notification.controller';
import { NOTIFICATION_REPOSITORY } from './notification.tokens';
import { ServiceTokenGuard } from './guards/service-token.guard';
import { NotificationSseService } from './sse/notification-sse.service';

@Module({
  controllers: [NotificationController, InternalNotificationController],
  providers: [
    ServiceTokenGuard,
    NotificationSseService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SendNotificationUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new SendNotificationUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: ListNotificationsUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new ListNotificationsUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: GetUnreadNotificationCountUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new GetUnreadNotificationCountUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new MarkNotificationReadUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: MarkAllNotificationsReadUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new MarkAllNotificationsReadUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: DeleteNotificationUseCase,
      useFactory: (repo: PrismaNotificationRepository) =>
        new DeleteNotificationUseCase(repo),
      inject: [NOTIFICATION_REPOSITORY],
    },
  ],
  exports: [
    SendNotificationUseCase,
    ListNotificationsUseCase,
    GetUnreadNotificationCountUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
    NotificationSseService,
  ],
})
export class NotificationModule {}
