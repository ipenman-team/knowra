import type { NotificationRepository } from '@knowra/domain';
import { normalizeRequiredText } from './utils';

export class GetUnreadNotificationCountUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async get(params: {
    tenantId: string;
    receiverId: string;
  }): Promise<{ count: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const receiverId = normalizeRequiredText('receiverId', params.receiverId);

    const count = await this.repo.countUnread({ tenantId, receiverId });
    return { count };
  }
}
