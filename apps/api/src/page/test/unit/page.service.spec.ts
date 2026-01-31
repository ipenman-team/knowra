import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PageService } from '../../page.service';
import type { PageDto } from '../../dto/page.dto';

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
    pageVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
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
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PageService, { provide: PrismaService, useValue: prisma }],
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
        where: { id: 'p1', tenantId: 't1' },
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
      prisma.page.findFirst.mockResolvedValue(samplePage({ title: 'Old' }));
      prisma.page.update.mockResolvedValue(samplePage({ title: 'New' }));
      prisma.pageVersion.create.mockResolvedValue({ id: 'v-temp' });
      prisma.pageVersion.findFirst.mockResolvedValue({ id: 'v-pub' });
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

      expect(prisma.pageVersion.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 't1',
          pageId: 'p1',
          status: 'PUBLISHED',
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
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
      prisma.pageVersion.create.mockResolvedValue({ id: 'v-temp' });
      prisma.pageVersion.findFirst.mockResolvedValue(null);

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
    it('deletes existing', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());
      prisma.page.delete.mockResolvedValue(samplePage());

      await expect(service.remove('p1', 't1')).resolves.toEqual({ ok: true });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', tenantId: 't1' },
      });
      expect(prisma.page.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.remove('p1', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
        where: { id: 'p1', tenantId: 't1' },
      });
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.get('p1', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('returns list ordered by updatedAt desc', async () => {
      prisma.page.findMany.mockResolvedValue([samplePage()]);

      await expect(service.list('t1', 's1')).resolves.toHaveLength(1);
      expect(prisma.page.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', spaceId: 's1' },
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
