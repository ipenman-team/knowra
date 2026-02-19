export type SendNotificationDto = {
  tenantId: string;
  senderId?: string;
  receiverIds: string[];
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
};
