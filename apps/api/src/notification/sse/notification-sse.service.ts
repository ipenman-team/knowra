import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

function writeEvent(
  res: Response,
  event: string,
  data: unknown,
  id?: string | null,
): void {
  if (id) {
    res.write(`id: ${id}\n`);
  }
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

@Injectable()
export class NotificationSseService {
  private readonly connections = new Map<string, Set<Response>>();

  private buildKey(tenantId: string, userId: string): string {
    return `${tenantId}:${userId}`;
  }

  addConnection(tenantId: string, userId: string, res: Response): () => void {
    const key = this.buildKey(tenantId, userId);
    const set = this.connections.get(key) ?? new Set<Response>();
    set.add(res);
    this.connections.set(key, set);

    return () => {
      const current = this.connections.get(key);
      if (!current) return;
      current.delete(res);
      if (current.size === 0) {
        this.connections.delete(key);
      }
    };
  }

  pushNotification(
    tenantId: string,
    userId: string,
    payload: {
      id?: string | null;
      type: string;
      title: string;
      body: string;
      link?: string | null;
      createdAt: string;
    },
  ): void {
    this.pushToUser(tenantId, userId, 'notification', payload, payload.id ?? null);
  }

  pushUnreadCountSync(tenantId: string, userId: string, count: number): void {
    this.pushToUser(tenantId, userId, 'unread_count_sync', { count });
  }

  getConnectionSize(tenantId: string, userId: string): number {
    return this.connections.get(this.buildKey(tenantId, userId))?.size ?? 0;
  }

  private pushToUser(
    tenantId: string,
    userId: string,
    event: string,
    data: unknown,
    id?: string | null,
  ): void {
    const key = this.buildKey(tenantId, userId);
    const targets = this.connections.get(key);
    if (!targets || targets.size === 0) return;

    const broken: Response[] = [];
    for (const res of targets) {
      try {
        writeEvent(res, event, data, id);
      } catch {
        broken.push(res);
      }
    }

    if (broken.length === 0) return;
    for (const res of broken) targets.delete(res);
    if (targets.size === 0) {
      this.connections.delete(key);
    }
  }
}
