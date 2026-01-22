import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    $transaction: jest.fn(),
    verificationCode: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    userIdentity: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    tenantMembership: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates user profile with email nickname on first login', async () => {
    prisma.verificationCode.findFirst.mockResolvedValue({
      id: 'vc1',
      code: '123456',
    });
    prisma.userIdentity.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    prisma.userIdentity.create.mockResolvedValue({ id: 'i1' });
    prisma.userProfile.findFirst.mockResolvedValue(null);
    prisma.userProfile.create.mockResolvedValue({ id: 'up1' });
    prisma.verificationCode.updateMany.mockResolvedValue({ count: 1 });
    prisma.tenantMembership.findFirst.mockResolvedValue({
      tenant: { id: 't1', type: 'PERSONAL', key: null, name: '个人空间' },
    });
    prisma.authSession.create.mockResolvedValue({ id: 's1' });

    await expect(
      service.loginOrRegisterByCode(
        {
          channel: 'email',
          recipient: 'a@b.com',
          code: '123456',
          type: 'login',
        },
        {},
      ),
    ).resolves.toMatchObject({
      ok: true,
      user: { id: 'u1' },
      tenant: { id: 't1' },
    });

    expect(prisma.userProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        nickname: 'a@b.com',
        avatarUrl: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        bio: null,
        phone: null,
        isDeleted: false,
        createdBy: 'u1',
        updatedBy: 'u1',
      },
      select: { id: true },
    });
  });

  it('creates user profile with phone nickname and phone field on first phone login', async () => {
    prisma.verificationCode.findFirst.mockResolvedValue({
      id: 'vc1',
      code: '123456',
    });
    prisma.userIdentity.findFirst.mockResolvedValue({
      id: 'i1',
      userId: 'u1',
      isVerified: true,
    });
    prisma.userProfile.findFirst.mockResolvedValue(null);
    prisma.userProfile.create.mockResolvedValue({ id: 'up1' });
    prisma.verificationCode.updateMany.mockResolvedValue({ count: 1 });
    prisma.tenantMembership.findFirst.mockResolvedValue({
      tenant: { id: 't1', type: 'PERSONAL', key: null, name: '个人空间' },
    });
    prisma.authSession.create.mockResolvedValue({ id: 's1' });

    await expect(
      service.loginOrRegisterByCode(
        {
          channel: 'sms',
          recipient: '+8613800138000',
          code: '123456',
          type: 'login',
        },
        {},
      ),
    ).resolves.toMatchObject({
      ok: true,
      user: { id: 'u1' },
      tenant: { id: 't1' },
    });

    expect(prisma.userProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        nickname: '+8613800138000',
        avatarUrl: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        bio: null,
        phone: '+8613800138000',
        isDeleted: false,
        createdBy: 'u1',
        updatedBy: 'u1',
      },
      select: { id: true },
    });
  });

  it('fills default avatarUrl when profile exists without avatar', async () => {
    prisma.verificationCode.findFirst.mockResolvedValue({
      id: 'vc1',
      code: '123456',
    });
    prisma.userIdentity.findFirst.mockResolvedValue({
      id: 'i1',
      userId: 'u1',
      isVerified: true,
    });
    prisma.userProfile.findFirst.mockResolvedValue({
      id: 'up1',
      nickname: 'Alice',
      avatarUrl: null,
      phone: null,
    });
    prisma.userProfile.update.mockResolvedValue({ id: 'up1' });
    prisma.verificationCode.updateMany.mockResolvedValue({ count: 1 });
    prisma.tenantMembership.findFirst.mockResolvedValue({
      tenant: { id: 't1', type: 'PERSONAL', key: null, name: '个人空间' },
    });
    prisma.authSession.create.mockResolvedValue({ id: 's1' });

    await expect(
      service.loginOrRegisterByCode(
        {
          channel: 'email',
          recipient: 'a@b.com',
          code: '123456',
          type: 'login',
        },
        {},
      ),
    ).resolves.toMatchObject({
      ok: true,
      user: { id: 'u1' },
      tenant: { id: 't1' },
    });

    expect(prisma.userProfile.update).toHaveBeenCalledWith({
      where: { id: 'up1' },
      data: {
        avatarUrl: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        updatedBy: 'u1',
      },
      select: { id: true },
    });
  });
});
