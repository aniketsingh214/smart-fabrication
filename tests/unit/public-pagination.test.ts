import { expect, it } from 'vitest';
import { browseHref, publicCursor, publicCursorFilter, publicWindow, singleQuery } from '@/features/catalog/public-pagination';
it('keeps timestamp precision and UUID tie ordering at a full public page boundary', () => {
  const stamp = '2026-10-16T00:00:00.123456Z', rows = Array.from({ length: 49 }, () => ({ id: crypto.randomUUID(), created_at: stamp }));
  const first = publicWindow(rows); expect(first.items).toHaveLength(48);
  const cursor = publicCursor(first.nextCursor!); expect(cursor).toEqual({ id: rows[47].id, created_at: stamp });
  expect(publicCursorFilter(cursor!)).toBe(`created_at.lt.${stamp},and(created_at.eq.${stamp},id.lt.${rows[47].id})`);
  expect(publicWindow([rows[48]]).nextCursor).toBeNull(); expect(publicWindow([]).nextCursor).toBeNull();
});
it('preserves filters in continuation/reset links and rejects malformed cursor input', () => {
  const path = browseHref('/catalog', { q: 'gate & grill', category: 'category' }, 'opaque'); const url = new URL(path, 'http://localhost');
  expect(url.searchParams.get('q')).toBe('gate & grill'); expect(url.searchParams.get('cursor')).toBe('opaque'); expect(url.searchParams.get('category')).toBe('category');
  expect(browseHref('/gallery', {})).toBe('/gallery'); expect(singleQuery(['first', 'ignored'])).toBe('first');
  for (const value of ['invalid!', Buffer.from(JSON.stringify({ id: 'injected', created_at: 'x' })).toString('base64url')]) expect(() => publicCursor(value)).toThrow();
});
