import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryCards } from '@/features/catalog/category-cards';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server', () => ({ serverClient: vi.fn() }));
vi.mock('@/components/product-visual', () => ({ ProductVisual: () => null }));
afterEach(() => vi.resetAllMocks());
function fixture(rows: unknown[], error: unknown = null) {
  const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: rows, error }) };
  for (const key of ['select','eq','is','order'] as const) query[key].mockReturnValue(query);
  vi.mocked(serverClient).mockResolvedValue({ from: () => query } as unknown as Awaited<ReturnType<typeof serverClient>>); return query;
}
it('uses active top-level database categories and exact category filters, respecting display order', async () => {
  const id = crypto.randomUUID(), query = fixture([{ id, name: 'Workshop gates', media_assets: null }]);
  const html = renderToStaticMarkup(await CategoryCards()); expect(html).toContain('Workshop gates'); expect(html).toContain(`/catalog?category=${id}`);
  expect(query.eq).toHaveBeenCalledWith('active', true); expect(query.is).toHaveBeenCalledWith('parent_id', null); expect(query.order).toHaveBeenCalledWith('sort_order'); expect(query.order).toHaveBeenCalledWith('id'); expect(query.limit).toHaveBeenCalledWith(8);
});
it('handles empty and unavailable category data without fabricated business categories', async () => {
  fixture([]); expect(renderToStaticMarkup(await CategoryCards())).toContain('discuss your custom fabrication');
  fixture([], { code: 'offline' }); const html = renderToStaticMarkup(await CategoryCards()); expect(html).toContain('Categories could not be loaded'); expect(html).not.toContain('/catalog?category=');
});
