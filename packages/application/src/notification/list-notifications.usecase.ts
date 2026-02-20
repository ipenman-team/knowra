import type { NotificationRepository } from '@knowra/domain';
import {
  normalizeBoolean,
  normalizeLimit,
  normalizeOptionalText,
  normalizeRequiredText,
} from './utils';

export class ListNotificationsUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async list(params: {
    tenantId: string;
    receiverId: string;
    cursor?: string | null;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const receiverId = normalizeRequiredText('receiverId', params.receiverId);
    const cursor = normalizeOptionalText(params.cursor);
    const limit = normalizeLimit(params.limit, 20);
    const unreadOnly = normalizeBoolean(params.unreadOnly, false);

    return await this.repo.list({
      tenantId,
      receiverId,
      cursor,
      limit,
      unreadOnly,
    });
  }
}
