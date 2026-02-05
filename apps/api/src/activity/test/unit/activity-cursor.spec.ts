import { decodeActivityCursor, encodeActivityCursor } from '../../../../../../packages/domain/src/activity/cursor';

describe('activity cursor', () => {
  test('encode/decode roundtrip', () => {
    const createdAt = new Date('2026-02-06T00:00:00.000Z');
    const id = 'cuid_123';
    const cursor = encodeActivityCursor({ createdAt, id });
    const decoded = decodeActivityCursor(cursor);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(id);
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  test('decode invalid cursor returns null', () => {
    expect(decodeActivityCursor('')).toBeNull();
    expect(decodeActivityCursor('not-a-date:id')).toBeNull();
    expect(decodeActivityCursor('2026-02-06T00:00:00.000Z:')).toBeNull();
  });
});
