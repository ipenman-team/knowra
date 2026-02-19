import type { NotificationRepository } from '@contexta/domain';
import {
  assertMaxLength,
  normalizeLink,
  normalizeMetadata,
  normalizeNotificationType,
  normalizeReceiverIds,
  normalizeRequestId,
  normalizeRequiredText,
} from './utils';

export class SendNotificationUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async send(params: {
    tenantId: string;
    senderId?: string | null;
    receiverIds: string[];
    type: string;
    title: string;
    body: string;
    link?: string | null;
    metadata?: unknown;
    requestId?: string | null;
  }): Promise<{ count: number; deduplicated: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const senderId =
      params.senderId === undefined || params.senderId === null
        ? null
        : normalizeRequiredText('senderId', params.senderId);
    const receiverIds = normalizeReceiverIds(params.receiverIds);
    const type = normalizeNotificationType(params.type);
    const title = normalizeRequiredText('title', params.title);
    const body = normalizeRequiredText('body', params.body);
    const link = normalizeLink(params.link);
    const metadata = normalizeMetadata(params.metadata);
    const requestId = normalizeRequestId(params.requestId);

    assertMaxLength('title', title, 120);
    assertMaxLength('body', body, 2000);
    if (metadata) {
      const bytes = Buffer.byteLength(JSON.stringify(metadata), 'utf8');
      if (bytes > 4096) {
        throw new Error('metadata must be <= 4KB');
      }
    }

    const actorId = senderId ?? 'system';

    return await this.repo.sendMany({
      tenantId,
      senderId,
      receiverIds,
      type,
      title,
      body,
      link,
      metadata,
      requestId,
      actorId,
    });
  }
}
