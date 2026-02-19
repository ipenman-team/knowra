import { apiClient } from './client';

export type NotificationDto = {
  id: string;
  tenantId: string;
  receiverId: string;
  senderId: string | null;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  requestId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export const notificationsApi = {
  async list(params?: {
    cursor?: string;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const res = await apiClient.get<{
      items: NotificationDto[];
      nextCursor?: string | null;
      hasMore?: boolean;
    }>('/notifications', {
      params: {
        cursor: params?.cursor,
        limit: params?.limit,
        unreadOnly: params?.unreadOnly,
      },
    });

    return {
      items: res.data.items ?? [],
      nextCursor: res.data.nextCursor ?? null,
      hasMore: Boolean(res.data.hasMore),
    };
  },

  async unreadCount() {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data;
  },

  async markRead(id: string) {
    const res = await apiClient.patch<{ updated: boolean }>(
      `/notifications/${encodeURIComponent(id)}/read`,
    );
    return res.data;
  },

  async markAllRead() {
    const res = await apiClient.patch<{ count: number }>('/notifications/read-all');
    return res.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<{ deleted: boolean }>(
      `/notifications/${encodeURIComponent(id)}`,
    );
    return res.data;
  },
};
