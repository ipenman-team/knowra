import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateSpaceRoleUseCase,
  DeleteSpaceRoleUseCase,
  ListSpaceRolesUseCase,
  UpdateSpaceRoleUseCase,
} from '@contexta/application';
import { SpaceRoleController } from '../../space-role.controller';

describe('SpaceRoleController', () => {
  let controller: SpaceRoleController;

  const listSpaceRolesUseCase = { list: jest.fn() };
  const createSpaceRoleUseCase = { create: jest.fn() };
  const updateSpaceRoleUseCase = { update: jest.fn() };
  const deleteSpaceRoleUseCase = { delete: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceRoleController],
      providers: [
        { provide: ListSpaceRolesUseCase, useValue: listSpaceRolesUseCase },
        { provide: CreateSpaceRoleUseCase, useValue: createSpaceRoleUseCase },
        { provide: UpdateSpaceRoleUseCase, useValue: updateSpaceRoleUseCase },
        { provide: DeleteSpaceRoleUseCase, useValue: deleteSpaceRoleUseCase },
      ],
    }).compile();

    controller = module.get(SpaceRoleController);
  });

  test('list requires authenticated user', async () => {
    await expect(controller.list('t1', undefined, 's1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  test('list forwards tenant/space/actor', async () => {
    listSpaceRolesUseCase.list.mockResolvedValue([{ id: 'r1' }]);

    const result = await controller.list('t1', 'u1', 's1');

    expect(listSpaceRolesUseCase.list).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
    });

    expect(result).toMatchObject({
      data: [{ id: 'r1' }],
    });
  });

  test('create forwards payload', async () => {
    createSpaceRoleUseCase.create.mockResolvedValue({ id: 'r1', name: '审阅者' });

    const result = await controller.create('t1', 'u1', 's1', {
      name: '审阅者',
      description: 'desc',
      permissions: ['space.view'],
    });

    expect(createSpaceRoleUseCase.create).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
      name: '审阅者',
      description: 'desc',
      permissions: ['space.view'],
    });

    expect(result).toMatchObject({ data: { id: 'r1' } });
  });

  test('update maps permission denied to forbidden', async () => {
    updateSpaceRoleUseCase.update.mockRejectedValue(new Error('permission denied'));

    await expect(
      controller.update('t1', 'u1', 's1', 'r1', { permissions: ['space.view'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('delete maps built-in role error to bad request', async () => {
    deleteSpaceRoleUseCase.delete.mockRejectedValue(
      new Error('built-in role cannot be deleted'),
    );

    await expect(controller.remove('t1', 'u1', 's1', 'r1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
