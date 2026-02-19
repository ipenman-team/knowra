import {
  CreateShareUseCase,
  GetShareAccessUseCase,
} from '../../../../../../packages/application/src/share';
import type {
  CreateShareParams,
  ListSharesParams,
  ListSharesResult,
  Share,
  ShareRepository,
  UpdateShareStatusParams,
} from '../../../../../../packages/domain/src/share';

function makeRepo(seed?: Share[]): ShareRepository {
  const items = [...(seed ?? [])];

  return {
    async create(params: CreateShareParams): Promise<Share> {
      const now = new Date();
      const share: Share = {
        id: `s${items.length + 1}`,
        tenantId: params.tenantId,
        type: params.type,
        targetId: params.targetId,
        status: params.status,
        visibility: params.visibility,
        publicId: params.publicId,
        tokenHash: params.tokenHash ?? null,
        expiresAt: params.expiresAt ?? null,
        passwordHash: params.passwordHash ?? null,
        extraData: params.extraData ?? null,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      items.push(share);
      return share;
    },
    async getById(params: { tenantId: string; shareId: string }): Promise<Share | null> {
      return (
        items.find(
          (x) =>
            x.tenantId === params.tenantId &&
            x.id === params.shareId &&
            !x.isDeleted,
        ) ?? null
      );
    },
    async getByTargetId(params: { tenantId: string; targetId: string }): Promise<Share | null> {
      return (
        items.find(
          (x) =>
            x.tenantId === params.tenantId &&
            x.targetId === params.targetId &&
            !x.isDeleted,
        ) ?? null
      );
    },
    async getByPublicId(params: { publicId: string }): Promise<Share | null> {
      return items.find((x) => x.publicId === params.publicId && !x.isDeleted) ?? null;
    },
    async list(params: ListSharesParams): Promise<ListSharesResult> {
      const filtered = items.filter((x) => {
        if (x.tenantId !== params.tenantId || x.isDeleted) return false;
        if (params.type && x.type !== params.type) return false;
        if (params.targetId && x.targetId !== params.targetId) return false;
        if (params.status && x.status !== params.status) return false;
        if (params.visibility && x.visibility !== params.visibility) return false;
        if (params.createdBy && x.createdBy !== params.createdBy) return false;
        return true;
      });

      const skip = Math.max(Number(params.skip ?? 0), 0);
      const take = Math.max(Number(params.take ?? 50), 1);
      return { items: filtered.slice(skip, skip + take), total: filtered.length };
    },
    async updateStatus(params: UpdateShareStatusParams): Promise<Share> {
      const idx = items.findIndex(
        (x) =>
          x.tenantId === params.tenantId &&
          x.id === params.shareId &&
          !x.isDeleted,
      );
      if (idx < 0) throw new Error('share not found');
      const current = items[idx];
      const next = {
        ...current,
        status: params.status,
        updatedBy: params.actorUserId,
        updatedAt: new Date(),
      };
      items[idx] = next;
      return next;
    },
  };
}

describe('Share usecases', () => {
  test('CreateShareUseCase revokes previous active share for same target', async () => {
    const repo = makeRepo([
      {
        id: 's1',
        tenantId: 't1',
        type: 'PAGE',
        targetId: 'p1',
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        publicId: 'old',
        tokenHash: null,
        expiresAt: null,
        passwordHash: null,
        extraData: null,
        createdBy: 'u1',
        updatedBy: 'u1',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const useCase = new CreateShareUseCase(repo);
    const result = await useCase.create({
      tenantId: 't1',
      type: 'PAGE',
      targetId: 'p1',
      visibility: 'PUBLIC',
      actorUserId: 'u1',
      tokenEnabled: false,
    });

    const list = await repo.list({
      tenantId: 't1',
      type: 'PAGE',
      targetId: 'p1',
      status: null,
      visibility: null,
      createdBy: null,
      skip: 0,
      take: 10,
    });

    const old = list.items.find((x) => x.id === 's1');
    expect(old?.status).toBe('REVOKED');
    expect(result.share.id).not.toBe('s1');
  });

  test('GetShareAccessUseCase validates password', async () => {
    const repo = makeRepo();
    const createUseCase = new CreateShareUseCase(repo);
    const accessUseCase = new GetShareAccessUseCase(repo);

    const created = await createUseCase.create({
      tenantId: 't1',
      type: 'PAGE',
      targetId: 'p1',
      visibility: 'RESTRICTED',
      password: 'secret',
      tokenEnabled: false,
      actorUserId: 'u1',
    });

    await expect(
      accessUseCase.getAccess({
        publicId: created.share.publicId,
        password: 'wrong',
      }),
    ).rejects.toThrow('password invalid');

    const ok = await accessUseCase.getAccess({
      publicId: created.share.publicId,
      password: 'secret',
    });
    expect(ok.id).toBe(created.share.id);
  });

  test('GetShareAccessUseCase expires share when expired', async () => {
    const repo = makeRepo();
    const createUseCase = new CreateShareUseCase(repo);
    const accessUseCase = new GetShareAccessUseCase(repo);

    const created = await createUseCase.create({
      tenantId: 't1',
      type: 'PAGE',
      targetId: 'p2',
      visibility: 'PUBLIC',
      expiresAt: new Date(Date.now() - 1000),
      tokenEnabled: false,
      actorUserId: 'u1',
    });

    await expect(
      accessUseCase.getAccess({
        publicId: created.share.publicId,
      }),
    ).rejects.toThrow('share expired');

    const updated = await repo.getById({ tenantId: 't1', shareId: created.share.id });
    expect(updated?.status).toBe('EXPIRED');
  });
});
