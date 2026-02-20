import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { ActivityRecorderUseCase } from '@knowra/application';
import { PrismaService } from '../../../prisma/prisma.service';
import { PageService } from '../../page.service';
import type { PageDto } from '../../dto/page.dto';
import { PageVersionService } from '../../page-version.service';
import { PageActivityAction } from '../../constant';

describe('PageService', () => {
  let service: PageService;

  const defaultSlateDoc = (): Prisma.JsonValue =>
    [
      {
        type: 'paragraph',
        children: [{ text: '' }],
      },
    ] as unknown as Prisma.JsonValue;

  const prisma = {
    page: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    ragChunk: {
      deleteMany: jest.fn(),
    },
    pageVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const pageVersionService = {
    listVersions: jest.fn(),
    getVersion: jest.fn(),
  };

  const activityRecorder = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const samplePage = (overrides?: Partial<PageDto>): PageDto => {
    const now = new Date('2026-01-11T00:00:00.000Z');
    return {
      id: 'p1',
      tenantId: 't1',
      spaceId: 's1',
      title: 'Hello',
      content: defaultSlateDoc(),
      parentIds: [],
      latestPublishedVersionId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageService,
        { provide: PrismaService, useValue: prisma },
        { provide: PageVersionService, useValue: pageVersionService },
        { provide: ActivityRecorderUseCase, useValue: activityRecorder },
      ],
    }).compile();

    service = module.get(PageService);
  });

  describe('create', () => {
    it('creates with defaults', async () => {
      prisma.page.create.mockResolvedValue(samplePage());
      prisma.pageVersion.create.mockResolvedValue({ id: 'v1' });

      await expect(
        service.create('t1', { title: 'Hello', spaceId: 's1' }),
      ).resolves.toMatchObject({
        id: 'p1',
        tenantId: 't1',
        title: 'Hello',
        content: defaultSlateDoc(),
      });

      expect(prisma.page.create).toHaveBeenCalledWith({
        data: {
          tenantId: 't1',
          spaceId: 's1',
          title: 'Hello',
          content: defaultSlateDoc() as unknown as Prisma.InputJsonValue,
          parentIds: [],
          createdBy: 'system',
          updatedBy: 'system',
        },
      });
    });

    it('rejects missing tenantId', async () => {
      await expect(
        service.create('', { title: 'Hello', spaceId: 's1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing title', async () => {
      await expect(
        service.create('t1', { title: '', spaceId: 's1' }),
      ).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('save', () => {
    it('updates existing and merges fields', async () => {
      prisma.page.findFirst.mockResolvedValue(
        samplePage({ title: 'Old', content: 'A', parentIds: ['x'] }),
      );
      prisma.page.update.mockResolvedValue(
        samplePage({ title: 'New', content: 'A', parentIds: ['x'] }),
      );
      prisma.pageVersion.create.mockResolvedValue({ id: 'v2' });

      await expect(
        service.save('t1', 'p1', { title: 'New' }),
      ).resolves.toMatchObject({
        id: 'p1',
        title: 'New',
        content: 'A',
        parentIds: ['x'],
      });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1', isDeleted: false },
      });
      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          title: 'New',
          content: 'A',
          parentIds: ['x'],
          updatedBy: 'system',
        },
      });
    });

    it('rejects missing id', async () => {
      await expect(service.save('t1', '', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects missing tenantId', async () => {
      await expect(service.save('', 'p1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws when page not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(
        service.save('t1', 'p1', { title: 'New' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('rename', () => {
    it('updates page title and syncs latest published title', async () => {
      prisma.page.findFirst.mockResolvedValue(
        samplePage({ title: 'Old', latestPublishedVersionId: 'v-pub' }),
      );
      prisma.page.update.mockResolvedValue(
        samplePage({ title: 'New', latestPublishedVersionId: 'v-pub' }),
      );
      prisma.pageVersion.update.mockResolvedValue({ id: 'v-pub' });

      await expect(
        service.rename('t1', 'p1', { title: 'New' }),
      ).resolves.toMatchObject({
        id: 'p1',
        title: 'New',
      });

      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          title: 'New',
          updatedBy: 'system',
        },
      });

      expect(prisma.pageVersion.update).toHaveBeenCalledWith({
        where: { id: 'v-pub' },
        data: {
          title: 'New',
          updatedBy: 'system',
        },
      });
    });

    it('updates page title and skips published sync when none exists', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage({ title: 'Old' }));
      prisma.page.update.mockResolvedValue(samplePage({ title: 'New' }));

      await expect(
        service.rename('t1', 'p1', { title: 'New' }),
      ).resolves.toMatchObject({
        id: 'p1',
        title: 'New',
      });

      expect(prisma.pageVersion.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes existing', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());
      prisma.page.update.mockResolvedValue(samplePage({ isDeleted: true } as any));
      prisma.ragChunk.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('p1', 't1')).resolves.toEqual({ ok: true });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1', isDeleted: false },
      });
      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isDeleted: true, updatedBy: 'system' },
      });
      expect(prisma.ragChunk.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', pageId: 'p1' },
      });
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.remove('p1', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('restores from trash', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage({ isDeleted: true } as any));
      prisma.page.update.mockResolvedValue(samplePage({ isDeleted: false } as any));

      await expect(service.restore('t1', 'p1')).resolves.toEqual({ ok: true });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1', isDeleted: true },
      });
      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isDeleted: false, updatedBy: 'system' },
      });
    });
  });

  describe('permanentRemove', () => {
    it('purges a trashed page', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage({ isDeleted: true } as any));
      prisma.ragChunk.deleteMany.mockResolvedValue({ count: 0 });
      prisma.page.delete.mockResolvedValue(samplePage({ isDeleted: true } as any));

      await expect(service.permanentRemove('p1', 't1')).resolves.toEqual({ ok: true });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1', isDeleted: true },
      });
      expect(prisma.ragChunk.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', pageId: 'p1' },
      });
      expect(prisma.page.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  describe('get', () => {
    it('returns page', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());

      await expect(service.get('p1', 't1')).resolves.toMatchObject({
        id: 'p1',
        tenantId: 't1',
      });
      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1', isDeleted: false },
      });
      expect(activityRecorder.record).not.toHaveBeenCalled();
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.get('p1', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('records page view activity when tracking is enabled', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());

      await expect(
        service.get('p1', 't1', { recordView: true, actorUserId: 'u1' }),
      ).resolves.toMatchObject({
        id: 'p1',
        tenantId: 't1',
      });

      expect(activityRecorder.record).toHaveBeenCalledWith({
        tenantId: 't1',
        actorUserId: 'u1',
        action: PageActivityAction.View,
        subjectType: 'page',
        subjectId: 'p1',
        metadata: {
          spaceId: 's1',
          title: 'Hello',
        },
      });
    });

    it('skips page view activity when actor user is missing', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());

      await service.get('p1', 't1', { recordView: true });

      expect(activityRecorder.record).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns list ordered by updatedAt desc', async () => {
      prisma.page.findMany.mockResolvedValue([samplePage()]);

      await expect(service.list('t1', 's1')).resolves.toHaveLength(1);
      expect(prisma.page.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', spaceId: 's1', isDeleted: false },
        skip: 0,
        take: 50,
        orderBy: { updatedAt: 'desc' },
        omit: { content: true },
      });
    });

    it('rejects missing tenantId', async () => {
      await expect(service.list('', 's1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects missing spaceId', async () => {
      await expect(service.list('t1', '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
