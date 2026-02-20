import type { NotificationRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class DeleteNotificationUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async delete(params: {
    tenantId: string;
    receiverId: string;
    notificationId: string;
  }): Promise<{ deleted: boolean }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const receiverId = normalizeRequiredText('receiverId', params.receiverId);
    const notificationId = normalizeRequiredText(
      'notificationId',
      params.notificationId,
    );

    const deleted = await this.repo.softDelete({
      tenantId,
      receiverId,
      notificationId,
    });

    return { deleted };
  }
}
