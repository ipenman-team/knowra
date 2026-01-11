import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { PageService } from '../../page.service';

describe('PageService', () => {
  let service: PageService;

  const prisma = {
    page: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const samplePage = (overrides?: Partial<any>) => {
    const now = new Date('2026-01-11T00:00:00.000Z');
    return {
      id: 'p1',
      tenantId: 't1',
      title: 'Hello',
      content: '',
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

      await expect(service.create('t1', { title: 'Hello' })).resolves.toMatchObject({
        id: 'p1',
        tenantId: 't1',
        title: 'Hello',
        content: '',
      });

      expect(prisma.page.create).toHaveBeenCalledWith({
        data: {
          tenantId: 't1',
          title: 'Hello',
          content: '',
          parentIds: [],
        },
      });
    });

    it('rejects missing tenantId', async () => {
      await expect(service.create('', { title: 'Hello' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing title', async () => {
      await expect(service.create('t1', { title: '' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('save', () => {
    it('updates existing and merges fields', async () => {
      prisma.page.findFirst.mockResolvedValue(
        samplePage({ title: 'Old', content: 'A', parentIds: ['x'] }),
      );
      prisma.page.update.mockResolvedValue(samplePage({ title: 'New', content: 'A', parentIds: ['x'] }));

      await expect(service.save('t1', 'p1', { title: 'New' })).resolves.toMatchObject({
        id: 'p1',
        title: 'New',
        content: 'A',
        parentIds: ['x'],
      });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: 't1' } });
      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          title: 'New',
          content: 'A',
          parentIds: ['x'],
        },
      });
    });

    it('rejects missing id', async () => {
      await expect(service.save('t1', '', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing tenantId', async () => {
      await expect(service.save('', 'p1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when page not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.save('t1', 'p1', { title: 'New' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes existing', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());
      prisma.page.delete.mockResolvedValue(samplePage());

      await expect(service.remove('p1', 't1')).resolves.toEqual({ ok: true });

      expect(prisma.page.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: 't1' } });
      expect(prisma.page.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.remove('p1', 't1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('get', () => {
    it('returns page', async () => {
      prisma.page.findFirst.mockResolvedValue(samplePage());

      await expect(service.get('p1', 't1')).resolves.toMatchObject({ id: 'p1', tenantId: 't1' });
      expect(prisma.page.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: 't1' } });
    });

    it('throws when not found', async () => {
      prisma.page.findFirst.mockResolvedValue(null);

      await expect(service.get('p1', 't1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns list ordered by updatedAt desc', async () => {
      prisma.page.findMany.mockResolvedValue([samplePage()]);

      await expect(service.list('t1')).resolves.toHaveLength(1);
      expect(prisma.page.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1' },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('rejects missing tenantId', async () => {
      await expect(service.list('')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
