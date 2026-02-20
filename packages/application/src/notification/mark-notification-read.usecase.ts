import type { NotificationRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class MarkNotificationReadUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async mark(params: {
    tenantId: string;
    receiverId: string;
    notificationId: string;
  }): Promise<{ updated: boolean }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const receiverId = normalizeRequiredText('receiverId', params.receiverId);
    const notificationId = normalizeRequiredText(
      'notificationId',
      params.notificationId,
    );

    const updated = await this.repo.markRead({
      tenantId,
      receiverId,
      notificationId,
    });

    return { updated };
  }
}
