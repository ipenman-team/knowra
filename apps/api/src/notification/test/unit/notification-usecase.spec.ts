import {
  DeleteNotificationUseCase,
  GetUnreadNotificationCountUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  SendNotificationUseCase,
} from '../../../../../../packages/application/src/notification';
import type {
  CountUnreadNotificationsParams,
  ListNotificationsParams,
  ListNotificationsResult,
  MarkAllNotificationsReadParams,
  MarkNotificationReadParams,
  Notification,
  NotificationRepository,
  SendNotificationsParams,
  SendNotificationsResult,
  SoftDeleteNotificationParams,
} from '../../../../../../packages/domain/src/notification';

function makeRepo(overrides?: Partial<NotificationRepository>): NotificationRepository {
  return {
    async sendMany(_params: SendNotificationsParams): Promise<SendNotificationsResult> {
      return { count: 0, deduplicated: 0 };
    },
    async list(_params: ListNotificationsParams): Promise<ListNotificationsResult> {
      return {
        items: [] as Notification[],
        nextCursor: null,
        hasMore: false,
      };
    },
    async countUnread(_params: CountUnreadNotificationsParams): Promise<number> {
      return 0;
    },
    async markRead(_params: MarkNotificationReadParams): Promise<boolean> {
      return false;
    },
    async markAllRead(_params: MarkAllNotificationsReadParams): Promise<number> {
      return 0;
    },
    async softDelete(_params: SoftDeleteNotificationParams): Promise<boolean> {
      return false;
    },
    ...overrides,
  };
}

describe('Notification usecases', () => {
  test('SendNotificationUseCase normalizes payload and deduplicates receivers', async () => {
    let captured: SendNotificationsParams | null = null;
    const repo = makeRepo({
      sendMany: async (params) => {
        captured = params;
        return { count: 2, deduplicated: 1 };
      },
    });

    const useCase = new SendNotificationUseCase(repo);
    await expect(
      useCase.send({
        tenantId: 't1',
        senderId: 'u1',
        receiverIds: ['u2', 'u2', 'u3'],
        type: 'mention',
        title: 'hello',
        body: 'world',
        link: '/spaces/s1/pages/p1',
        metadata: { pageId: 'p1' },
        requestId: 'req-1',
      }),
    ).resolves.toEqual({ count: 2, deduplicated: 1 });

    expect(captured).toEqual({
      tenantId: 't1',
      senderId: 'u1',
      receiverIds: ['u2', 'u3'],
      type: 'MENTION',
      title: 'hello',
      body: 'world',
      link: '/spaces/s1/pages/p1',
      metadata: { pageId: 'p1' },
      requestId: 'req-1',
      actorId: 'u1',
    });
  });

  test('SendNotificationUseCase uses system actor when senderId is empty', async () => {
    let capturedActor = '';
    const repo = makeRepo({
      sendMany: async (params) => {
        capturedActor = params.actorId;
        return { count: 1, deduplicated: 0 };
      },
    });

    const useCase = new SendNotificationUseCase(repo);

    await expect(
      useCase.send({
        tenantId: 't1',
        receiverIds: ['u2'],
        type: 'SYSTEM',
        title: 'title',
        body: 'body',
      }),
    ).resolves.toEqual({ count: 1, deduplicated: 0 });

    expect(capturedActor).toBe('system');
  });

  test('SendNotificationUseCase rejects external link', async () => {
    const repo = makeRepo();
    const useCase = new SendNotificationUseCase(repo);

    await expect(
      useCase.send({
        tenantId: 't1',
        receiverIds: ['u1'],
        type: 'SYSTEM',
        title: 'title',
        body: 'body',
        link: 'https://evil.com',
      }),
    ).rejects.toThrow('link must start with "/"');
  });

  test('ListNotificationsUseCase clamps limit and forwards filters', async () => {
    let captured: ListNotificationsParams | null = null;
    const repo = makeRepo({
      list: async (params) => {
        captured = params;
        return {
          items: [],
          hasMore: false,
          nextCursor: null,
        };
      },
    });
    const useCase = new ListNotificationsUseCase(repo);

    await expect(
      useCase.list({
        tenantId: 't1',
        receiverId: 'u1',
        limit: 999,
        unreadOnly: true,
        cursor: '2026-01-01T00:00:00.000Z:n1',
      }),
    ).resolves.toEqual({
      items: [],
      hasMore: false,
      nextCursor: null,
    });

    expect(captured).toEqual({
      tenantId: 't1',
      receiverId: 'u1',
      limit: 50,
      unreadOnly: true,
      cursor: '2026-01-01T00:00:00.000Z:n1',
    });
  });

  test('MarkNotificationReadUseCase and MarkAllNotificationsReadUseCase work', async () => {
    const markRead = jest.fn<Promise<boolean>, [MarkNotificationReadParams]>(
      async () => true,
    );
    const markAllRead = jest.fn<Promise<number>, [MarkAllNotificationsReadParams]>(
      async () => 4,
    );

    const repo = makeRepo({
      markRead,
      markAllRead,
    });

    const markOneUseCase = new MarkNotificationReadUseCase(repo);
    const markAllUseCase = new MarkAllNotificationsReadUseCase(repo);

    await expect(
      markOneUseCase.mark({
        tenantId: 't1',
        receiverId: 'u1',
        notificationId: 'n1',
      }),
    ).resolves.toEqual({ updated: true });

    await expect(
      markAllUseCase.markAll({
        tenantId: 't1',
        receiverId: 'u1',
      }),
    ).resolves.toEqual({ count: 4 });
  });

  test('GetUnreadNotificationCountUseCase and DeleteNotificationUseCase work', async () => {
    const repo = makeRepo({
      countUnread: async () => 9,
      softDelete: async () => true,
    });

    const getUnreadCount = new GetUnreadNotificationCountUseCase(repo);
    const deleteUseCase = new DeleteNotificationUseCase(repo);

    await expect(
      getUnreadCount.get({ tenantId: 't1', receiverId: 'u1' }),
    ).resolves.toEqual({ count: 9 });

    await expect(
      deleteUseCase.delete({
        tenantId: 't1',
        receiverId: 'u1',
        notificationId: 'n1',
      }),
    ).resolves.toEqual({ deleted: true });
  });
});
