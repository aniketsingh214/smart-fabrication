import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FeaturedProducts } from '@/features/catalog/featured-products';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server', () => ({ serverClient: vi.fn() }));
vi.mock('@/components/product-visual', () => ({ ProductVisual: () => null }));
afterEach(() => vi.resetAllMocks());
function fixture(rows: unknown[], error: unknown = null) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: rows, error }) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query);
  vi.mocked(serverClient).mockResolvedValue({ from: () => query } as unknown as Awaited<ReturnType<typeof serverClient>>); return query;
}
it('selects only explicitly featured published products with stable bounded ordering', async () => {
  const query = fixture([{ id: crypto.randomUUID(), name: 'Reviewed gate', slug: 'reviewed-gate', material: 'Steel', product_media: [] }]);
  const html = renderToStaticMarkup(await FeaturedProducts()); expect(html).toContain('Reviewed gate'); expect(html).toContain('/catalog/reviewed-gate');
  expect(query.eq).toHaveBeenCalledWith('status', 'published'); expect(query.eq).toHaveBeenCalledWith('featured', true); expect(query.order).toHaveBeenCalledWith('id', { ascending: false }); expect(query.limit).toHaveBeenCalledWith(6);
});
it('omits an empty editorial section and reports query failure without inventing products', async () => {
  fixture([]); expect(await FeaturedProducts()).toBeNull();
  fixture([], { code: 'database-unavailable' }); const html = renderToStaticMarkup(await FeaturedProducts()); expect(html).toContain('Featured designs could not be loaded'); expect(html).not.toContain('/catalog/');
});
