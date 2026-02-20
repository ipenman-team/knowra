import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SendNotificationUseCase } from '@knowra/application';
import { Response } from '@knowra/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ServiceTokenGuard } from './guards/service-token.guard';
import { NotificationSseService } from './sse/notification-sse.service';

function normalizeHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

@Controller('internal/notifications')
@UseGuards(ServiceTokenGuard)
export class InternalNotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly notificationSseService: NotificationSseService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('send')
  async send(
    @Body() body: SendNotificationDto,
    @Headers('x-request-id') requestIdHeader: string | string[] | undefined,
    @Headers('x-caller-service') callerServiceHeader:
      | string
      | string[]
      | undefined,
  ) {
    const callerService = normalizeHeader(callerServiceHeader) ?? 'unknown-service';

    try {
      const tenantId = this.requireText('tenantId', body.tenantId);
      const senderId =
        typeof body.senderId === 'string' && body.senderId.trim()
          ? body.senderId.trim()
          : null;
      const receiverIds = this.normalizeReceiverIds(body.receiverIds);

      await this.assertUsersBelongToTenant(tenantId, receiverIds, 'receiverIds');
      if (senderId) {
        await this.assertUsersBelongToTenant(tenantId, [senderId], 'senderId');
      }

      const requestId =
        (typeof body.requestId === 'string' && body.requestId.trim()
          ? body.requestId.trim()
          : null) ?? normalizeHeader(requestIdHeader);

      const result = await this.sendNotificationUseCase.send({
        tenantId,
        senderId,
        receiverIds,
        type: body.type,
        title: body.title,
        body: body.body,
        link: body.link,
        metadata: {
          ...(body.metadata ?? {}),
          callerService,
        },
        requestId,
      });

      const createdAt = new Date().toISOString();
      for (const receiverId of receiverIds) {
        this.notificationSseService.pushNotification(tenantId, receiverId, {
          id: requestId,
          type: String(body.type ?? ''),
          title: String(body.title ?? ''),
          body: String(body.body ?? ''),
          link: body.link ?? null,
          createdAt,
        });
      }

      return new Response(result);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private requireText(name: string, raw: unknown): string {
    if (typeof raw !== 'string') throw new BadRequestException(`${name} is required`);
    const value = raw.trim();
    if (!value) throw new BadRequestException(`${name} is required`);
    return value;
  }

  private normalizeReceiverIds(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      throw new BadRequestException('receiverIds must be array');
    }

    const values = raw
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => Boolean(item));
    const unique = [...new Set(values)];

    if (unique.length === 0) {
      throw new BadRequestException('receiverIds is required');
    }

    return unique;
  }

  private async assertUsersBelongToTenant(
    tenantId: string,
    userIds: string[],
    field: string,
  ): Promise<void> {
    const rows = await this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        isDeleted: false,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    const existing = new Set(rows.map((item) => item.userId));
    const missing = userIds.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `${field} contains users outside current tenant`,
      );
    }
  }
}
