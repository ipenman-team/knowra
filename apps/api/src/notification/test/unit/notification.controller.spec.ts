import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import {
  DeleteNotificationUseCase,
  GetUnreadNotificationCountUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '@contexta/application';
import { NotificationController } from '../../notification.controller';
import { NotificationSseService } from '../../sse/notification-sse.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const listUseCase = { list: jest.fn() };
  const unreadUseCase = { get: jest.fn() };
  const markReadUseCase = { mark: jest.fn() };
  const markAllReadUseCase = { markAll: jest.fn() };
  const deleteUseCase = { delete: jest.fn() };
  const sseService = {
    addConnection: jest.fn(),
    pushUnreadCountSync: jest.fn(),
  };

  beforeEach(async () => {
    jest.useRealTimers();
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: ListNotificationsUseCase, useValue: listUseCase },
        {
          provide: GetUnreadNotificationCountUseCase,
          useValue: unreadUseCase,
        },
        { provide: MarkNotificationReadUseCase, useValue: markReadUseCase },
        {
          provide: MarkAllNotificationsReadUseCase,
          useValue: markAllReadUseCase,
        },
        { provide: DeleteNotificationUseCase, useValue: deleteUseCase },
        { provide: NotificationSseService, useValue: sseService },
      ],
    }).compile();

    controller = module.get(NotificationController);
  });

  test('list requires login user', async () => {
    await expect(
      controller.list('t1', undefined, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('list forwards query into usecase', async () => {
    listUseCase.list.mockResolvedValue({
      items: [{ id: 'n1' }],
      nextCursor: 'next',
      hasMore: true,
    });

    const result = await controller.list('t1', 'u1', {
      limit: '30',
      cursor: 'c1',
      unreadOnly: 'true',
    });

    expect(listUseCase.list).toHaveBeenCalledWith({
      tenantId: 't1',
      receiverId: 'u1',
      limit: 30,
      cursor: 'c1',
      unreadOnly: true,
    });

    expect(result).toMatchObject({
      data: [{ id: 'n1' }],
      meta: { nextCursor: 'next', hasMore: true },
    });
  });

  test('mark read syncs unread count by SSE', async () => {
    markReadUseCase.mark.mockResolvedValue({ updated: true });
    unreadUseCase.get.mockResolvedValue({ count: 2 });

    const result = await controller.markRead('t1', 'u1', 'n1');

    expect(markReadUseCase.mark).toHaveBeenCalledWith({
      tenantId: 't1',
      receiverId: 'u1',
      notificationId: 'n1',
    });

    expect(unreadUseCase.get).toHaveBeenCalledWith({
      tenantId: 't1',
      receiverId: 'u1',
    });

    expect(sseService.pushUnreadCountSync).toHaveBeenCalledWith('t1', 'u1', 2);
    expect(result).toMatchObject({ data: { updated: true } });
  });

  test('mark all read syncs unread count by SSE', async () => {
    markAllReadUseCase.markAll.mockResolvedValue({ count: 5 });
    unreadUseCase.get.mockResolvedValue({ count: 0 });

    const result = await controller.markAllRead('t1', 'u1');

    expect(markAllReadUseCase.markAll).toHaveBeenCalledWith({
      tenantId: 't1',
      receiverId: 'u1',
    });
    expect(sseService.pushUnreadCountSync).toHaveBeenCalledWith('t1', 'u1', 0);
    expect(result).toMatchObject({ data: { count: 5 } });
  });

  test('delete syncs unread count by SSE', async () => {
    deleteUseCase.delete.mockResolvedValue({ deleted: true });
    unreadUseCase.get.mockResolvedValue({ count: 1 });

    const result = await controller.remove('t1', 'u1', 'n9');

    expect(deleteUseCase.delete).toHaveBeenCalledWith({
      tenantId: 't1',
      receiverId: 'u1',
      notificationId: 'n9',
    });
    expect(sseService.pushUnreadCountSync).toHaveBeenCalledWith('t1', 'u1', 1);
    expect(result).toMatchObject({ data: { deleted: true } });
  });

  test('stream registers connection and sends heartbeat', async () => {
    jest.useFakeTimers();

    const cleanup = jest.fn();
    sseService.addConnection.mockReturnValue(cleanup);
    unreadUseCase.get.mockResolvedValue({ count: 3 });

    const req = new EventEmitter() as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await controller.stream('t1', 'u1', req, res);

    expect(sseService.addConnection).toHaveBeenCalledWith('t1', 'u1', res);
    expect(sseService.pushUnreadCountSync).toHaveBeenCalledWith('t1', 'u1', 3);

    jest.advanceTimersByTime(25000);
    expect((res.write as jest.Mock).mock.calls).toEqual(
      expect.arrayContaining([['event: ping\n'], ['data: {}\n\n']]),
    );

    req.emit('close');
    expect(cleanup).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });
});
