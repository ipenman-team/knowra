import type { Response } from 'express';
import { NotificationSseService } from '../../sse/notification-sse.service';

function mockResponse() {
  const writes: string[] = [];
  const res = {
    write: jest.fn((chunk: string) => {
      writes.push(chunk);
      return true;
    }),
  } as unknown as Response;

  return { res, writes };
}

describe('NotificationSseService', () => {
  test('manages multiple connections for same user', () => {
    const service = new NotificationSseService();
    const a = mockResponse();
    const b = mockResponse();

    const cleanupA = service.addConnection('t1', 'u1', a.res);
    const cleanupB = service.addConnection('t1', 'u1', b.res);

    expect(service.getConnectionSize('t1', 'u1')).toBe(2);

    service.pushNotification('t1', 'u1', {
      id: 'n1',
      type: 'SYSTEM',
      title: 'title',
      body: 'body',
      link: '/spaces/s1',
      createdAt: '2026-02-19T00:00:00.000Z',
    });

    expect(a.writes.join('')).toContain('event: notification');
    expect(b.writes.join('')).toContain('event: notification');

    cleanupA();
    expect(service.getConnectionSize('t1', 'u1')).toBe(1);

    cleanupB();
    expect(service.getConnectionSize('t1', 'u1')).toBe(0);
  });

  test('pushUnreadCountSync writes count payload', () => {
    const service = new NotificationSseService();
    const a = mockResponse();

    service.addConnection('t1', 'u1', a.res);
    service.pushUnreadCountSync('t1', 'u1', 7);

    expect(a.writes.join('')).toContain('event: unread_count_sync');
    expect(a.writes.join('')).toContain('{"count":7}');
  });
});
