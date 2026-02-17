import {
  GetFavoriteStatusUseCase,
  ListFavoritesUseCase,
  SetFavoriteUseCase,
} from '../../../../../../packages/application/src/favorite';
import type {
  DeleteFavoriteParams,
  Favorite,
  FavoriteRepository,
  GetFavoriteParams,
  ListFavoritesParams,
  ListFavoritesResult,
  UpsertFavoriteParams,
} from '../../../../../../packages/domain/src/favorite';

function makeRepo(seed?: Favorite[]): FavoriteRepository {
  const items = [...(seed ?? [])];

  return {
    async upsert(params: UpsertFavoriteParams): Promise<Favorite> {
      const now = new Date();
      const index = items.findIndex(
        (item) =>
          item.tenantId === params.tenantId &&
          item.userId === params.userId &&
          item.targetType === params.targetType &&
          item.targetId === params.targetId,
      );

      if (index >= 0) {
        const current = items[index];
        const updated: Favorite = {
          ...current,
          isDeleted: false,
          extraData: params.extraData ?? null,
          updatedBy: params.userId,
          updatedAt: now,
        };
        items[index] = updated;
        return updated;
      }

      const created: Favorite = {
        id: `f${items.length + 1}`,
        tenantId: params.tenantId,
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        extraData: params.extraData ?? null,
        createdBy: params.userId,
        updatedBy: params.userId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      items.push(created);
      return created;
    },

    async softDelete(params: DeleteFavoriteParams): Promise<void> {
      const index = items.findIndex(
        (item) =>
          item.tenantId === params.tenantId &&
          item.userId === params.userId &&
          item.targetType === params.targetType &&
          item.targetId === params.targetId &&
          !item.isDeleted,
      );

      if (index < 0) return;
      const current = items[index];
      items[index] = {
        ...current,
        isDeleted: true,
        updatedBy: params.userId,
        updatedAt: new Date(),
      };
    },

    async get(params: GetFavoriteParams): Promise<Favorite | null> {
      return (
        items.find(
          (item) =>
            item.tenantId === params.tenantId &&
            item.userId === params.userId &&
            item.targetType === params.targetType &&
            item.targetId === params.targetId &&
            !item.isDeleted,
        ) ?? null
      );
    },

    async list(params: ListFavoritesParams): Promise<ListFavoritesResult> {
      const filtered = items.filter((item) => {
        if (item.tenantId !== params.tenantId) return false;
        if (item.userId !== params.userId) return false;
        if (item.isDeleted) return false;
        if (params.targetType && item.targetType !== params.targetType) {
          return false;
        }
        if (params.targetIds && params.targetIds.length > 0) {
          return params.targetIds.includes(item.targetId);
        }
        return true;
      });

      const skip = Math.max(Number(params.skip ?? 0), 0);
      const take = Math.max(Number(params.take ?? 100), 1);
      return {
        items: filtered.slice(skip, skip + take),
        total: filtered.length,
      };
    },
  };
}

describe('Favorite usecases', () => {
  test('SetFavoriteUseCase and GetFavoriteStatusUseCase work for PAGE', async () => {
    const repo = makeRepo();
    const setUseCase = new SetFavoriteUseCase(repo);
    const statusUseCase = new GetFavoriteStatusUseCase(repo);

    await expect(
      statusUseCase.getStatus({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'page',
        targetId: 'p1',
      }),
    ).resolves.toEqual({ favorite: false });

    await expect(
      setUseCase.set({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'page',
        targetId: 'p1',
        favorite: true,
      }),
    ).resolves.toEqual({ favorite: true });

    await expect(
      statusUseCase.getStatus({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'PAGE',
        targetId: 'p1',
      }),
    ).resolves.toEqual({ favorite: true });
  });

  test('SetFavoriteUseCase can cancel favorite', async () => {
    const seed: Favorite = {
      id: 'f1',
      tenantId: 't1',
      userId: 'u1',
      targetType: 'SPACE',
      targetId: 's1',
      extraData: null,
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repo = makeRepo([seed]);
    const setUseCase = new SetFavoriteUseCase(repo);
    const statusUseCase = new GetFavoriteStatusUseCase(repo);

    await expect(
      setUseCase.set({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'SPACE',
        targetId: 's1',
        favorite: false,
      }),
    ).resolves.toEqual({ favorite: false });

    await expect(
      statusUseCase.getStatus({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'SPACE',
        targetId: 's1',
      }),
    ).resolves.toEqual({ favorite: false });
  });

  test('ListFavoritesUseCase supports filtering and pagination', async () => {
    const now = new Date();
    const repo = makeRepo([
      {
        id: 'f1',
        tenantId: 't1',
        userId: 'u1',
        targetType: 'SPACE',
        targetId: 's1',
        extraData: null,
        createdBy: 'u1',
        updatedBy: 'u1',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'f2',
        tenantId: 't1',
        userId: 'u1',
        targetType: 'PAGE',
        targetId: 'p1',
        extraData: null,
        createdBy: 'u1',
        updatedBy: 'u1',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'f3',
        tenantId: 't1',
        userId: 'u2',
        targetType: 'PAGE',
        targetId: 'p2',
        extraData: null,
        createdBy: 'u2',
        updatedBy: 'u2',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const useCase = new ListFavoritesUseCase(repo);

    await expect(
      useCase.list({
        tenantId: 't1',
        userId: 'u1',
        targetType: 'page',
        targetIds: ['p1', 'p2'],
        skip: 0,
        take: 10,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: 'f2', targetType: 'PAGE', targetId: 'p1' }],
    });
  });
});
