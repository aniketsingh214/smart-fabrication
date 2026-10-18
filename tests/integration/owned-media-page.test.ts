import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ownedMediaPage } from '@/features/media/owned-page';
function fixture(rows: unknown[], error: unknown = null) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), or: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error }).then(resolve) };
  for (const key of ['select', 'eq', 'order', 'limit', 'or'] as const) query[key].mockReturnValue(query);
  return { query, db: { from: () => query } as unknown as SupabaseClient };
}
it('pages only the authenticated owner assets with stable timestamp/UUID continuation', async () => {
  const rows = Array.from({ length: 2 }, () => ({ id: crypto.randomUUID(), created_at: '2026-10-17T00:00:00.123456Z' })), { db, query } = fixture(rows), owner = crypto.randomUUID();
  const first = await ownedMediaPage(db, owner, new URLSearchParams({ limit: '1' })); expect(first.items).toEqual([rows[0]]); expect(query.eq).toHaveBeenCalledWith('owner_user_id', owner); expect(query.limit).toHaveBeenCalledWith(2);
  await ownedMediaPage(db, owner, new URLSearchParams({ cursor: first.nextCursor! })); expect(query.or).toHaveBeenCalledWith(`created_at.lt.${rows[0].created_at},and(created_at.eq.${rows[0].created_at},id.lt.${rows[0].id})`);
  expect(query.select).not.toHaveBeenCalledWith(expect.stringContaining('owner_user_id'));
});
it('keeps the 100 default, rejects unsafe cursors/limits before querying and propagates denial', async () => {
  const { db, query } = fixture([]); expect(await ownedMediaPage(db, crypto.randomUUID(), new URLSearchParams())).toEqual({ items: [], nextCursor: null }); expect(query.limit).toHaveBeenCalledWith(101);
  const fresh = fixture([]); for (const params of [{ limit: '101' }, { cursor: 'bad!' }] as Record<string, string>[]) await expect(ownedMediaPage(fresh.db, crypto.randomUUID(), new URLSearchParams(params))).rejects.toThrow(); expect(fresh.query.select).not.toHaveBeenCalled();
  await expect(ownedMediaPage(fixture([], { code: '42501' }).db, crypto.randomUUID(), new URLSearchParams())).rejects.toMatchObject({ status: 403 });
});
