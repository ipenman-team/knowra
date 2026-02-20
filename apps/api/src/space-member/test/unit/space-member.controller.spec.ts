import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BatchRemoveMembersUseCase,
  BatchUpdateMemberRoleUseCase,
  ListSpaceMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberRoleUseCase,
} from '@knowra/application';
import { SpaceMemberController } from '../../space-member.controller';

describe('SpaceMemberController', () => {
  let controller: SpaceMemberController;

  const listSpaceMembersUseCase = { list: jest.fn() };
  const updateMemberRoleUseCase = { update: jest.fn() };
  const batchUpdateMemberRoleUseCase = { update: jest.fn() };
  const removeMemberUseCase = { remove: jest.fn() };
  const batchRemoveMembersUseCase = { remove: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceMemberController],
      providers: [
        { provide: ListSpaceMembersUseCase, useValue: listSpaceMembersUseCase },
        { provide: UpdateMemberRoleUseCase, useValue: updateMemberRoleUseCase },
        {
          provide: BatchUpdateMemberRoleUseCase,
          useValue: batchUpdateMemberRoleUseCase,
        },
        { provide: RemoveMemberUseCase, useValue: removeMemberUseCase },
        {
          provide: BatchRemoveMembersUseCase,
          useValue: batchRemoveMembersUseCase,
        },
      ],
    }).compile();

    controller = module.get(SpaceMemberController);
  });

  test('list requires authenticated user', async () => {
    await expect(
      controller.list('t1', undefined, 's1', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('list forwards query and returns list response with meta', async () => {
    listSpaceMembersUseCase.list.mockResolvedValue({
      items: [{ id: 'm1' }],
      total: 1,
      skip: 0,
      take: 20,
    });

    const result = await controller.list('t1', 'u1', 's1', {
      q: 'alice',
      skip: 0,
      take: 20,
    });

    expect(listSpaceMembersUseCase.list).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
      q: 'alice',
      skip: 0,
      take: 20,
    });

    expect(result).toMatchObject({
      data: [{ id: 'm1' }],
      meta: {
        total: 1,
        skip: 0,
        take: 20,
      },
    });
  });

  test('update role forwards payload', async () => {
    updateMemberRoleUseCase.update.mockResolvedValue({ ok: true });

    const result = await controller.updateRole('t1', 'u1', 's1', 'm1', {
      roleId: 'r1',
    });

    expect(updateMemberRoleUseCase.update).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      memberId: 'm1',
      roleId: 'r1',
      actorUserId: 'u1',
    });
    expect(result).toMatchObject({ data: { ok: true } });
  });

  test('batch update maps permission denied to forbidden', async () => {
    batchUpdateMemberRoleUseCase.update.mockRejectedValue(
      new Error('permission denied'),
    );

    await expect(
      controller.batchUpdateRole('t1', 'u1', 's1', {
        memberIds: ['m1'],
        roleId: 'r1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('batch remove maps owner protected error to bad request', async () => {
    batchRemoveMembersUseCase.remove.mockRejectedValue(
      new Error('owner member cannot be removed'),
    );

    await expect(
      controller.batchRemove('t1', 'u1', 's1', {
        memberIds: ['m1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
