export const NotificationType = {
  System: 'SYSTEM',
  Mention: 'MENTION',
  CommentReply: 'COMMENT_REPLY',
  TaskDone: 'TASK_DONE',
  AiDone: 'AI_DONE',
  Custom: 'CUSTOM',
} as const;

export type NotificationKnownType =
  (typeof NotificationType)[keyof typeof NotificationType];

export type NotificationTypeValue = NotificationKnownType | string;

export type NotificationMetadata = Record<string, unknown> | null;

export type Notification = {
  id: string;
  tenantId: string;
  receiverId: string;
  senderId: string | null;

  type: NotificationTypeValue;
  title: string;
  body: string;
  link: string | null;
  metadata: NotificationMetadata;
  requestId: string | null;

  isRead: boolean;
  readAt: Date | null;

  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SendNotificationsParams = {
  tenantId: string;
  senderId?: string | null;
  receiverIds: string[];
  type: NotificationTypeValue;
  title: string;
  body: string;
  link?: string | null;
  metadata?: NotificationMetadata;
  requestId?: string | null;
  actorId: string;
};

export type SendNotificationsResult = {
  count: number;
  deduplicated: number;
};

export type ListNotificationsParams = {
  tenantId: string;
  receiverId: string;
  cursor?: string | null;
  limit: number;
  unreadOnly?: boolean | null;
};

export type ListNotificationsResult = {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CountUnreadNotificationsParams = {
  tenantId: string;
  receiverId: string;
};

export type MarkNotificationReadParams = {
  tenantId: string;
  receiverId: string;
  notificationId: string;
};

export type MarkAllNotificationsReadParams = {
  tenantId: string;
  receiverId: string;
};

export type SoftDeleteNotificationParams = {
  tenantId: string;
  receiverId: string;
  notificationId: string;
};
