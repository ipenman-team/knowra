import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AcceptSpaceInvitationUseCase,
  CreateSpaceEmailInvitationsUseCase,
  CreateSpaceLinkInvitationUseCase,
  ListSpaceInvitationsUseCase,
  ListSpaceMembersUseCase,
  ResendSpaceInvitationUseCase,
} from '@contexta/application';
import {
  SpaceInvitationAcceptController,
  SpaceInvitationController,
} from '../../space-invitation.controller';

describe('SpaceInvitationController', () => {
  let controller: SpaceInvitationController;

  const createEmailInvitationsUseCase = { create: jest.fn() };
  const createLinkInvitationUseCase = { create: jest.fn() };
  const listSpaceInvitationsUseCase = { list: jest.fn() };
  const resendSpaceInvitationUseCase = { resend: jest.fn() };
  const listSpaceMembersUseCase = { list: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceInvitationController],
      providers: [
        {
          provide: CreateSpaceEmailInvitationsUseCase,
          useValue: createEmailInvitationsUseCase,
        },
        {
          provide: CreateSpaceLinkInvitationUseCase,
          useValue: createLinkInvitationUseCase,
        },
        {
          provide: ListSpaceInvitationsUseCase,
          useValue: listSpaceInvitationsUseCase,
        },
        {
          provide: ResendSpaceInvitationUseCase,
          useValue: resendSpaceInvitationUseCase,
        },
        {
          provide: ListSpaceMembersUseCase,
          useValue: listSpaceMembersUseCase,
        },
      ],
    }).compile();

    controller = module.get(SpaceInvitationController);
  });

  test('listMembers requires authenticated user', async () => {
    await expect(controller.listMembers('t1', undefined, 's1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  test('listMembers forwards tenant/space/actor to usecase', async () => {
    listSpaceMembersUseCase.list.mockResolvedValue([{ id: 'm1' }]);

    const result = await controller.listMembers('t1', 'u1', 's1');

    expect(listSpaceMembersUseCase.list).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
    });
    expect(result).toMatchObject({
      data: [{ id: 'm1' }],
    });
  });

  test('listInvitations parses comma separated statuses', async () => {
    listSpaceInvitationsUseCase.list.mockResolvedValue([{ id: 'i1' }]);

    await controller.listInvitations('t1', 'u1', 's1', {
      status: 'pending, accepted ,revoked',
    });

    expect(listSpaceInvitationsUseCase.list).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
      statuses: ['PENDING', 'ACCEPTED', 'REVOKED'],
    });
  });

  test('listInvitations maps permission denied to forbidden', async () => {
    listSpaceInvitationsUseCase.list.mockRejectedValue(new Error('permission denied'));

    await expect(
      controller.listInvitations('t1', 'u1', 's1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('createEmailInvitations forwards payload', async () => {
    createEmailInvitationsUseCase.create.mockResolvedValue([
      { invitation: { id: 'i1' }, inviteToken: 't1', inviteUrl: '/invite/space?token=t1' },
    ]);

    const result = await controller.createEmailInvitations('t1', 'u1', 's1', {
      emails: ['a@example.com', 'b@example.com'],
      role: 'ADMIN',
    });

    expect(createEmailInvitationsUseCase.create).toHaveBeenCalledWith({
      tenantId: 't1',
      spaceId: 's1',
      actorUserId: 'u1',
      emails: ['a@example.com', 'b@example.com'],
      role: 'ADMIN',
    });
    expect(result).toMatchObject({
      data: [{ invitation: { id: 'i1' } }],
    });
  });

  test('createLinkInvitation maps not found to 404', async () => {
    createLinkInvitationUseCase.create.mockRejectedValue(new Error('invitation not found'));

    await expect(
      controller.createLinkInvitation('t1', 'u1', 's1', { role: 'MEMBER' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('resendInvitation maps revoked to bad request', async () => {
    resendSpaceInvitationUseCase.resend.mockRejectedValue(new Error('invitation revoked'));

    await expect(
      controller.resendInvitation('t1', 'u1', 's1', 'i1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SpaceInvitationAcceptController', () => {
  let controller: SpaceInvitationAcceptController;

  const acceptSpaceInvitationUseCase = { accept: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceInvitationAcceptController],
      providers: [
        {
          provide: AcceptSpaceInvitationUseCase,
          useValue: acceptSpaceInvitationUseCase,
        },
      ],
    }).compile();

    controller = module.get(SpaceInvitationAcceptController);
  });

  test('accept requires authenticated user', async () => {
    await expect(controller.accept(undefined, { token: 'tk1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  test('accept forwards token and actor', async () => {
    acceptSpaceInvitationUseCase.accept.mockResolvedValue({
      tenantId: 't1',
      spaceId: 's1',
      invitationId: 'i1',
    });

    const result = await controller.accept('u1', { token: 'tk1' });

    expect(acceptSpaceInvitationUseCase.accept).toHaveBeenCalledWith({
      token: 'tk1',
      actorUserId: 'u1',
    });
    expect(result).toMatchObject({
      data: { tenantId: 't1', spaceId: 's1', invitationId: 'i1' },
    });
  });

  test('accept maps invitation email mismatch to bad request', async () => {
    acceptSpaceInvitationUseCase.accept.mockRejectedValue(
      new Error('invitation email mismatch'),
    );

    await expect(controller.accept('u1', { token: 'tk1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
