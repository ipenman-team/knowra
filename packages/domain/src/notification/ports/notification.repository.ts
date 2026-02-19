import type {
  CountUnreadNotificationsParams,
  ListNotificationsParams,
  ListNotificationsResult,
  MarkAllNotificationsReadParams,
  MarkNotificationReadParams,
  SendNotificationsParams,
  SendNotificationsResult,
  SoftDeleteNotificationParams,
} from '../types';

export interface NotificationRepository {
  sendMany(params: SendNotificationsParams): Promise<SendNotificationsResult>;
  list(params: ListNotificationsParams): Promise<ListNotificationsResult>;
  countUnread(params: CountUnreadNotificationsParams): Promise<number>;
  markRead(params: MarkNotificationReadParams): Promise<boolean>;
  markAllRead(params: MarkAllNotificationsReadParams): Promise<number>;
  softDelete(params: SoftDeleteNotificationParams): Promise<boolean>;
}
