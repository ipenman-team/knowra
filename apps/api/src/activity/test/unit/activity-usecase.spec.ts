import { ActivityQueryUseCase, ActivityRecorderUseCase } from '../../../../../../packages/application/src/activity';
import type { ActivityRepository } from '../../../../../../packages/domain/src/activity/ports/activity.repository';
import type { Activity } from '../../../../../../packages/domain/src/activity/types';

function makeRepo(): ActivityRepository {
  return {
    async create(params) {
      const now = params.occurredAt ?? new Date();
      return {
        id: 'id',
        tenantId: params.tenantId,
        action: params.action,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        actorUserId: params.actorUserId,
        occurredAt: now,
        metadata: params.metadata ?? null,
        traceId: params.traceId ?? null,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      } satisfies Activity;
    },
    async list(params) {
      return { items: [], hasMore: false, nextCursor: null };
    },
    async dailyStats() {
      return { items: [] };
    },
  };
}

describe('Activity usecases', () => {
  test('ActivityRecorderUseCase requires tenantId', async () => {
    const recorder = new ActivityRecorderUseCase(makeRepo());
    await expect(
      recorder.record({
        tenantId: '',
        actorUserId: 'u1',
        action: 'A',
        subjectType: 'space',
        subjectId: 's1',
      }),
    ).rejects.toThrow('tenantId is required');
  });

  test('ActivityQueryUseCase clamps limit to 200', async () => {
    const repo: ActivityRepository = {
      async create() {
        throw new Error('not used');
      },
      async list(params) {
        expect(params.limit).toBe(200);
        return { items: [], hasMore: false, nextCursor: null };
      },
      async dailyStats() {
        throw new Error('not used');
      },
    };

    const query = new ActivityQueryUseCase(repo);
    await query.list({ tenantId: 't1', limit: 9999 });
  });
});
