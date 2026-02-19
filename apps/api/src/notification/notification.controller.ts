import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DeleteNotificationUseCase,
  GetUnreadNotificationCountUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '@contexta/application';
import { ListResponse, Response as HttpResponse } from '@contexta/shared';
import type { Request, Response } from 'express';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationSseService } from './sse/notification-sse.service';

function parseLimit(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseUnreadOnly(raw: string | undefined): boolean {
  if (!raw) return false;
  return raw === 'true' || raw === '1';
}

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly getUnreadNotificationCountUseCase: GetUnreadNotificationCountUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
    private readonly notificationSseService: NotificationSseService,
  ) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Query() query: ListNotificationsDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.listNotificationsUseCase.list({
      tenantId,
      receiverId: userId,
      limit: parseLimit(query.limit),
      cursor: query.cursor,
      unreadOnly: parseUnreadOnly(query.unreadOnly),
    });

    return new ListResponse(result.items, undefined, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Get('unread-count')
  async unreadCount(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    return new HttpResponse(
      await this.getUnreadNotificationCountUseCase.get({
        tenantId,
        receiverId: userId,
      }),
    );
  }

  @Patch(':id/read')
  async markRead(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.markNotificationReadUseCase.mark({
      tenantId,
      receiverId: userId,
      notificationId: id,
    });

    await this.syncUnreadCount(tenantId, userId);
    return new HttpResponse(result);
  }

  @Patch('read-all')
  async markAllRead(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.markAllNotificationsReadUseCase.markAll({
      tenantId,
      receiverId: userId,
    });

    await this.syncUnreadCount(tenantId, userId);
    return new HttpResponse(result);
  }

  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.deleteNotificationUseCase.delete({
      tenantId,
      receiverId: userId,
      notificationId: id,
    });

    await this.syncUnreadCount(tenantId, userId);
    return new HttpResponse(result);
  }

  @Get('stream')
  async stream(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!userId) throw new UnauthorizedException('unauthorized');

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const cleanup = this.notificationSseService.addConnection(tenantId, userId, res);

    const countResult = await this.getUnreadNotificationCountUseCase.get({
      tenantId,
      receiverId: userId,
    });
    this.notificationSseService.pushUnreadCountSync(
      tenantId,
      userId,
      countResult.count,
    );

    const timer = setInterval(() => {
      try {
        res.write('event: ping\n');
        res.write('data: {}\n\n');
      } catch {
        cleanup();
      }
    }, 25000);

    const closeHandler = () => {
      clearInterval(timer);
      cleanup();
      req.off('close', closeHandler);
      req.off('aborted', closeHandler);
      try {
        res.end();
      } catch {
        // noop
      }
    };

    req.on('close', closeHandler);
    req.on('aborted', closeHandler);
  }

  private async syncUnreadCount(tenantId: string, userId: string): Promise<void> {
    const { count } = await this.getUnreadNotificationCountUseCase.get({
      tenantId,
      receiverId: userId,
    });
    this.notificationSseService.pushUnreadCountSync(tenantId, userId, count);
  }
}
