import { Test, TestingModule } from '@nestjs/testing';
import { PageController } from '../../page.controller';
import { PageService } from '../../page.service';

describe('PageController', () => {
  let controller: PageController;

  const pageService = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
      providers: [{ provide: PageService, useValue: pageService }],
    }).compile();

    controller = module.get(PageController);
  });

  it('create forwards body', async () => {
    pageService.create.mockResolvedValue({ id: 'p1' });

    await expect(controller.create({ tenantId: 't1', title: 'Hello' })).resolves.toEqual({
      id: 'p1',
    });

    expect(pageService.create).toHaveBeenCalledWith({ tenantId: 't1', title: 'Hello' });
  });

  it('save forwards id + body', async () => {
    pageService.save.mockResolvedValue({ id: 'p1', title: 'X' });

    await expect(controller.save('p1', { tenantId: 't1', title: 'X' })).resolves.toEqual({
      id: 'p1',
      title: 'X',
    });

    expect(pageService.save).toHaveBeenCalledWith('p1', { tenantId: 't1', title: 'X' });
  });

  it('remove forwards id + tenantId', async () => {
    pageService.remove.mockResolvedValue({ ok: true });

    await expect(controller.remove('p1', 't1')).resolves.toEqual({ ok: true });
    expect(pageService.remove).toHaveBeenCalledWith('p1', 't1');
  });

  it('get forwards id + tenantId', async () => {
    pageService.get.mockResolvedValue({ id: 'p1' });

    await expect(controller.get('p1', 't1')).resolves.toEqual({ id: 'p1' });
    expect(pageService.get).toHaveBeenCalledWith('p1', 't1');
  });

  it('list forwards tenantId', async () => {
    pageService.list.mockResolvedValue([{ id: 'p1' }]);

    await expect(controller.list('t1')).resolves.toEqual([{ id: 'p1' }]);
    expect(pageService.list).toHaveBeenCalledWith('t1');
  });
});
