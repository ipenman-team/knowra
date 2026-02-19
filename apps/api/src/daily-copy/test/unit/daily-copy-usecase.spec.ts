import { GenerateTodayDailyCopyUseCase, GetTodayDailyCopyUseCase } from '../../../../../../packages/application/src/daily-copy';
import type { DailyCopyChatProvider } from '../../../../../../packages/application/src/daily-copy/generate-today-daily-copy.usecase';
import type { DailyCopy, DailyCopyRepository } from '../../../../../../packages/domain/src/daily-copy';

function makeRepo(overrides?: Partial<DailyCopyRepository>): DailyCopyRepository {
  const base: DailyCopyRepository = {
    async findByDay() {
      return null;
    },
    async create(params) {
      const now = new Date();
      return {
        id: 'id',
        tenantId: params.tenantId,
        userId: params.userId,
        day: params.day,
        category: params.category,
        content: params.content,
        expiresAt: params.expiresAt,
        createdBy: params.userId,
        updatedBy: params.userId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      } satisfies DailyCopy;
    },
    async updateMetadata(params) {
      const now = new Date();
      return {
        id: 'id',
        tenantId: params.tenantId,
        userId: params.userId,
        day: params.day,
        category: 'WARM',
        content: '测试文案',
        metadata: params.metadata,
        expiresAt: new Date(now.getTime() + 60_000),
        createdBy: params.userId,
        updatedBy: params.userId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      } satisfies DailyCopy;
    },
  };

  return { ...base, ...(overrides ?? {}) };
}

function makeChat(overrides?: Partial<DailyCopyChatProvider>): DailyCopyChatProvider {
  const base: DailyCopyChatProvider = {
    model: 'test',
    async generate() {
      return { content: '测试文案' };
    },
  };

  return { ...base, ...(overrides ?? {}) };
}

describe('Daily copy usecases', () => {
  test('GetTodayDailyCopyUseCase requires tenantId', async () => {
    const useCase = new GetTodayDailyCopyUseCase(makeRepo());
    await expect(
      useCase.getToday({ tenantId: '', userId: 'u1', now: new Date() }),
    ).rejects.toThrow('tenantId is required');
  });

  test('GenerateTodayDailyCopyUseCase returns existing without calling LLM', async () => {
    const existing: DailyCopy = {
      id: 'e1',
      tenantId: 't1',
      userId: 'u1',
      day: '2026-02-08',
      category: 'WARM',
      content: '已存在',
      expiresAt: new Date(2026, 1, 8, 23, 59, 59, 999),
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chat = makeChat({
      async generate() {
        throw new Error('should not call');
      },
    });

    const repo = makeRepo({
      async findByDay() {
        return existing;
      },
    });

    const useCase = new GenerateTodayDailyCopyUseCase(repo, chat, () => 0);
    const res = await useCase.generateToday({
      tenantId: 't1',
      userId: 'u1',
      now: new Date(2026, 1, 8, 10, 0, 0),
    });

    expect(res.id).toBe('e1');
  });

  test('GenerateTodayDailyCopyUseCase creates record with local day key and end-of-day expiry', async () => {
    const now = new Date(2026, 1, 8, 10, 0, 0);

    let created: any = null;
    const repo = makeRepo({
      async create(params) {
        created = params;
        return await makeRepo().create(params);
      },
    });

    const chat = makeChat({
      async generate() {
        return { content: '  一句话\n两行  ' };
      },
    });

    const useCase = new GenerateTodayDailyCopyUseCase(repo, chat, () => 0);
    const res = await useCase.generateToday({ tenantId: 't1', userId: 'u1', now });

    expect(created.day).toBe('2026-02-08');
    expect(created.expiresAt.getHours()).toBe(23);
    expect(created.expiresAt.getMinutes()).toBe(59);
    expect(res.content).toBe('一句话 两行');
  });
});
