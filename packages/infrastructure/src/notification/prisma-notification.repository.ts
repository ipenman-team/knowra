import { Prisma, type NotificationType as PrismaNotificationType, type PrismaClient } from '@prisma/client';
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  type CountUnreadNotificationsParams,
  type ListNotificationsParams,
  type ListNotificationsResult,
  type MarkAllNotificationsReadParams,
  type MarkNotificationReadParams,
  type Notification,
  type NotificationRepository,
  type SendNotificationsParams,
  type SendNotificationsResult,
  type SoftDeleteNotificationParams,
} from '@knowra/domain';

function normalizeMetadata(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapNotification(row: {
  id: string;
  tenantId: string;
  receiverId: string;
  senderId: string | null;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: Prisma.JsonValue | null;
  requestId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Notification {
  return {
    ...row,
    metadata: normalizeMetadata(row.metadata),
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async sendMany(
    params: SendNotificationsParams,
  ): Promise<SendNotificationsResult> {
    if (params.receiverIds.length === 0) {
      return { count: 0, deduplicated: 0 };
    }

    const result = await this.prisma.notification.createMany({
      data: params.receiverIds.map((receiverId) => ({
        tenantId: params.tenantId,
        senderId: params.senderId ?? null,
        receiverId,
        type: params.type as PrismaNotificationType,
        title: params.title,
        body: params.body,
        link: params.link ?? null,
        metadata: (params.metadata ?? null) as Prisma.InputJsonValue,
        requestId: params.requestId ?? null,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      })),
      skipDuplicates: true,
    });

    const total = params.receiverIds.length;
    return {
      count: result.count,
      deduplicated: Math.max(0, total - result.count),
    };
  }

  async list(params: ListNotificationsParams): Promise<ListNotificationsResult> {
    const where: Prisma.NotificationWhereInput = {
      tenantId: params.tenantId,
      receiverId: params.receiverId,
      isDeleted: false,
      isRead: params.unreadOnly ? false : undefined,
    };

    const decoded = params.cursor ? decodeNotificationCursor(params.cursor) : null;
    if (decoded) {
      where.OR = [
        { createdAt: { lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
      ];
    }

    const take = params.limit + 1;
    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    const last = items.at(-1);

    return {
      items: items.map(mapNotification),
      hasMore,
      nextCursor: hasMore && last ? encodeNotificationCursor(last) : null,
    };
  }

  async countUnread(params: CountUnreadNotificationsParams): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        tenantId: params.tenantId,
        receiverId: params.receiverId,
        isDeleted: false,
        isRead: false,
      },
    });
  }

  async markRead(params: MarkNotificationReadParams): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: params.notificationId,
        tenantId: params.tenantId,
        receiverId: params.receiverId,
        isDeleted: false,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        updatedBy: params.receiverId,
      },
    });

    return result.count > 0;
  }

  async markAllRead(params: MarkAllNotificationsReadParams): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId: params.tenantId,
        receiverId: params.receiverId,
        isDeleted: false,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        updatedBy: params.receiverId,
      },
    });

    return result.count;
  }

  async softDelete(params: SoftDeleteNotificationParams): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: params.notificationId,
        tenantId: params.tenantId,
        receiverId: params.receiverId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        updatedBy: params.receiverId,
      },
    });

    return result.count > 0;
  }
}
