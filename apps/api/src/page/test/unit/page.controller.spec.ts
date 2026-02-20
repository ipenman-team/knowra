import { Test, TestingModule } from '@nestjs/testing';
import { PageController } from '../../page.controller';
import { PageService } from '../../page.service';
import { PageLikeService } from '../../page-like.service';
import { RagIndexService } from '../../../rag/rag.index.service';
import { ExportPageUseCase } from '@knowra/application';

describe('PageController', () => {
  let controller: PageController;

  const pageService = {
    create: jest.fn(),
    rename: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
    permanentRemove: jest.fn(),
    listTrash: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
    listTree: jest.fn(),
  };

  const ragIndexService = {
    startIndexPublished: jest.fn(),
  };

  const pageLikeService = {
    getSummary: jest.fn(),
    setLike: jest.fn(),
  };

  const exportPageUseCase = {
    export: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
      providers: [
        { provide: PageService, useValue: pageService },
        { provide: PageLikeService, useValue: pageLikeService },
        { provide: RagIndexService, useValue: ragIndexService },
        { provide: ExportPageUseCase, useValue: exportPageUseCase },
      ],
    }).compile();

    controller = module.get(PageController);
  });

  it('create forwards tenantId + body', async () => {
    pageService.create.mockResolvedValue({ id: 'p1' });

    await expect(
      controller.create('t1', 's1', undefined, { title: 'Hello', spaceId: 'x' }),
    ).resolves.toMatchObject({
      data: { id: 'p1' },
    });

    expect(pageService.create).toHaveBeenCalledWith(
      't1',
      { title: 'Hello', spaceId: 's1' },
      undefined,
    );
  });

  it('save forwards tenantId + id + body', async () => {
    pageService.save.mockResolvedValue({ id: 'p1', title: 'X' });

    await expect(
      controller.save('t1', 'p1', { title: 'X' }),
    ).resolves.toMatchObject({
      data: { id: 'p1', title: 'X' },
    });

    expect(pageService.save).toHaveBeenCalledWith(
      't1',
      'p1',
      { title: 'X' },
    );
  });

  it('rename forwards tenantId + id + body', async () => {
    pageService.rename.mockResolvedValue({ id: 'p1', title: 'Y' });

    await expect(
      controller.rename('t1', 'p1', { title: 'Y' }),
    ).resolves.toMatchObject({
      data: { id: 'p1', title: 'Y' },
    });

    expect(pageService.rename).toHaveBeenCalledWith(
      't1',
      'p1',
      { title: 'Y' },
    );
  });

  it('remove forwards id + tenantId', async () => {
    pageService.remove.mockResolvedValue({ ok: true });

    await expect(controller.remove('p1', 't1', undefined)).resolves.toMatchObject({
      data: { ok: true },
    });
    expect(pageService.remove).toHaveBeenCalledWith('p1', 't1', undefined);
  });

  it('get forwards id + tenantId', async () => {
    pageService.get.mockResolvedValue({ id: 'p1' });

    await expect(controller.get('p1', 't1')).resolves.toMatchObject({
      data: { id: 'p1' },
    });
    expect(pageService.get).toHaveBeenCalledWith('p1', 't1');
  });

  it('list forwards tenantId', async () => {
    pageService.list.mockResolvedValue([{ id: 'p1' }]);

    await expect(controller.list('t1', 's1', { q: 'hi' })).resolves.toMatchObject({
      data: [{ id: 'p1' }],
    });
    expect(pageService.list).toHaveBeenCalledWith('t1', 's1', { q: 'hi' });
  });

  it('listTree forwards tenantId + spaceId + query', async () => {
    pageService.listTree.mockResolvedValue({
      items: [{ id: 'p1' }],
      nextCursor: null,
      hasMore: false,
    });

    await expect(
      controller.listTree('t1', 's1', { take: 50 }),
    ).resolves.toMatchObject({
      data: [{ id: 'p1' }],
      meta: { nextCursor: null, hasMore: false },
    });

    expect(pageService.listTree).toHaveBeenCalledWith('t1', 's1', { take: 50 });
  });
});
