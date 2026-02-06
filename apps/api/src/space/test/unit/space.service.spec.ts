import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { ActivityRecorderUseCase } from '@contexta/application';
import { PrismaService } from '../../../prisma/prisma.service';
import { PageService } from '../../../page/page.service';
import { SpaceService } from '../../space.service';

describe('SpaceService', () => {
  let service: SpaceService;

  const prisma = {
    space: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const pageService = {
    create: jest.fn(),
  };

  const activityRecorder = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    activityRecorder.record.mockResolvedValue({ id: 'a1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceService,
        { provide: PrismaService, useValue: prisma },
        { provide: PageService, useValue: pageService },
        { provide: ActivityRecorderUseCase, useValue: activityRecorder },
      ],
    }).compile();

    service = module.get(SpaceService);
  });

  it('creates space and auto-creates usage guide page', async () => {
    const now = new Date('2026-02-06T00:00:00.000Z');

    prisma.space.create.mockResolvedValue({
      id: 's1',
      tenantId: 't1',
      name: 'Demo',
      description: null,
      icon: null,
      color: null,
      identifier: null,
      type: 'ORG',
      metadata: {},
      isArchived: false,
      isDeleted: false,
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: now,
      updatedAt: now,
    });

    pageService.create.mockResolvedValue({ id: 'p1' });

    await expect(service.create('t1', { name: 'Demo' } as any, 'u1')).resolves.toMatchObject({
      id: 's1',
      tenantId: 't1',
      name: 'Demo',
    });

    expect(pageService.create).toHaveBeenCalledTimes(1);
    expect(pageService.create).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        spaceId: 's1',
        title: '使用指南',
        content: expect.anything() as Prisma.InputJsonValue,
      }),
      'u1',
    );
  });

  it('rolls back space (soft delete) if guide page creation fails', async () => {
    const now = new Date('2026-02-06T00:00:00.000Z');

    prisma.space.create.mockResolvedValue({
      id: 's1',
      tenantId: 't1',
      name: 'Demo',
      description: null,
      icon: null,
      color: null,
      identifier: null,
      type: 'ORG',
      metadata: {},
      isArchived: false,
      isDeleted: false,
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: now,
      updatedAt: now,
    });

    pageService.create.mockRejectedValue(new Error('boom'));
    prisma.space.update.mockResolvedValue({ id: 's1' });

    await expect(service.create('t1', { name: 'Demo' } as any, 'u1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(prisma.space.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isDeleted: true, updatedBy: 'u1' },
    });
  });
});
