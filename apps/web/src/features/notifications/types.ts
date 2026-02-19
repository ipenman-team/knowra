import type { NotificationDto } from '@/lib/api';

export type InboxNotification = NotificationDto;

export type NotificationEventPayload = {
  id?: string | null;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  createdAt: string;
};
