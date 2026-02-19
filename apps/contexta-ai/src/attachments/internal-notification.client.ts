import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type SendNotificationInput = {
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

@Injectable()
export class InternalNotificationClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    const baseUrl = process.env.API_BASE_URL?.trim() || 'http://localhost:3001';
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = process.env.INTERNAL_SERVICE_TOKEN?.trim() || '';
  }

  async send(input: SendNotificationInput): Promise<void> {
    if (!this.token) return;
    if (!input.receiverIds || input.receiverIds.length === 0) return;

    const requestId = input.requestId?.trim() || `ctxa-ai-${randomUUID()}`;

    try {
      await fetch(`${this.baseUrl}/internal/notifications/send`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-service-token': this.token,
          'x-caller-service': 'contexta-ai',
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          ...input,
          requestId,
        }),
      });
    } catch {
      // Do not break AI flow when notification RPC fails.
    }
  }
}
