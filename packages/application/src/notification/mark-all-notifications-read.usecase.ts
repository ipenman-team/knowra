import type { NotificationRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async markAll(params: {
    tenantId: string;
    receiverId: string;
  }): Promise<{ count: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const receiverId = normalizeRequiredText('receiverId', params.receiverId);

    const count = await this.repo.markAllRead({ tenantId, receiverId });
    return { count };
  }
}
