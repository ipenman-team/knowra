import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SendNotificationUseCase } from '@knowra/application';
import { PrismaService } from '../../../prisma/prisma.service';
import { InternalNotificationController } from '../../internal-notification.controller';
import { NotificationSseService } from '../../sse/notification-sse.service';

describe('InternalNotificationController', () => {
  let controller: InternalNotificationController;

  const sendUseCase = { send: jest.fn() };
  const sseService = { pushNotification: jest.fn() };
  const prisma = {
    tenantMembership: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalNotificationController],
      providers: [
        { provide: SendNotificationUseCase, useValue: sendUseCase },
        { provide: NotificationSseService, useValue: sseService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get(InternalNotificationController);
  });

  test('send validates tenant users and forwards payload', async () => {
    prisma.tenantMembership.findMany
      .mockResolvedValueOnce([{ userId: 'u2' }, { userId: 'u3' }])
      .mockResolvedValueOnce([{ userId: 'u1' }]);
    sendUseCase.send.mockResolvedValue({ count: 2, deduplicated: 0 });

    const result = await controller.send(
      {
        tenantId: 't1',
        senderId: 'u1',
        receiverIds: ['u2', 'u3'],
        type: 'MENTION',
        title: 't',
        body: 'b',
        link: '/spaces/s1/pages/p1',
      },
      'req-header',
      'knowra-ai',
    );

    expect(sendUseCase.send).toHaveBeenCalledWith({
      tenantId: 't1',
      senderId: 'u1',
      receiverIds: ['u2', 'u3'],
      type: 'MENTION',
      title: 't',
      body: 'b',
      link: '/spaces/s1/pages/p1',
      metadata: { callerService: 'knowra-ai' },
      requestId: 'req-header',
    });

    expect(sseService.pushNotification).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ data: { count: 2, deduplicated: 0 } });
  });

  test('send rejects users outside tenant', async () => {
    prisma.tenantMembership.findMany.mockResolvedValue([{ userId: 'u2' }]);

    await expect(
      controller.send(
        {
          tenantId: 't1',
          receiverIds: ['u2', 'u3'],
          type: 'SYSTEM',
          title: 't',
          body: 'b',
        },
        undefined,
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
