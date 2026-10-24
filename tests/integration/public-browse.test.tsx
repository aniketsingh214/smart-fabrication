import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Catalog from '@/app/(public)/catalog/page';
import Gallery from '@/app/(public)/gallery/page';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server', () => ({ serverClient: vi.fn() }));
vi.mock('@/components/demo-photography', () => ({ DemoPhotography: () => null }));
vi.mock('@/components/product-visual', () => ({ ProductVisual: () => null }));
afterEach(() => vi.resetAllMocks());
it('applies material and indicative-budget predicates while preserving filters in continuation',async()=>{
 const {query}=fixture();const html=renderToStaticMarkup(await Catalog({searchParams:Promise.resolve({material:'Steel',budget:'50000'})}));
 expect(query.ilike).toHaveBeenCalledWith('material','%Steel%');expect(query.gt).toHaveBeenCalledWith('price_min_minor',0);expect(query.lte).toHaveBeenCalledWith('price_min_minor',5000000);
 const href=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&')).find(value=>value.includes('cursor='))!;
 const url=new URL(href,'https://example.com');expect(url.searchParams.get('material')).toBe('Steel');expect(url.searchParams.get('budget')).toBe('50000');
});
function fixture() {
  const rows = Array.from({ length: 49 }, (_, i) => ({ id: crypto.randomUUID(), created_at: '2026-10-16T00:00:00.123456Z', name: `Browse record ${i}`, slug: `browse-${i}`, description: '', material: 'Steel', price_min_minor: null, price_max_minor: null, product_media: [], media_assets: null, alt_text: '' }));
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), or: vi.fn(), ilike: vi.fn(), gt: vi.fn(), lte: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve) };
  for (const key of ['select', 'eq', 'order', 'limit', 'or', 'ilike', 'gt', 'lte'] as const) query[key].mockReturnValue(query);
  const categories = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: [], error: null }) }; categories.select.mockReturnValue(categories); categories.eq.mockReturnValue(categories);
  vi.mocked(serverClient).mockResolvedValue({ from: (table: string) => table === 'categories' ? categories : query } as unknown as Awaited<ReturnType<typeof serverClient>>);
  return { rows, query };
}
it('renders 48 published designs with filter-preserving continuation and stable database ordering', async () => {
  const { query } = fixture(), category = crypto.randomUUID();
  const html = renderToStaticMarkup(await Catalog({ searchParams: Promise.resolve({ q: 'gate & grill', category }) }));
  expect(html).toContain('Browse record 47'); expect(html).not.toContain('Browse record 48'); expect(html).toContain('More designs');
  const href = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&')).find(value => value.includes('cursor='))!;
  const url = new URL(href, 'http://localhost'); expect(url.searchParams.get('q')).toBe('gate & grill'); expect(url.searchParams.get('category')).toBe(category);
  expect(query.eq).toHaveBeenCalledWith('status', 'published'); expect(query.eq).toHaveBeenCalledWith('category_id', category); expect(query.limit).toHaveBeenCalledWith(49); expect(query.order).toHaveBeenCalledWith('id', { ascending: false });
  await Catalog({ searchParams: Promise.resolve({ q: 'gate & grill', category, cursor: url.searchParams.get('cursor')! }) }); expect(query.or).toHaveBeenCalledWith(expect.stringContaining('created_at.lt.2026-10-16T00:00:00.123456Z'));
});
it('gallery continuation retains published and consent guards', async () => {
  const { query } = fixture(), html = renderToStaticMarkup(await Gallery({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('More projects'); expect(html).not.toContain('Browse record 48'); expect(query.eq).toHaveBeenCalledWith('status', 'published'); expect(query.eq).toHaveBeenCalledWith('consent_confirmed', true); expect(query.limit).toHaveBeenCalledWith(49);
});
it('invalid browser cursors offer a reset before any database request', async () => {
  const html = renderToStaticMarkup(await Catalog({ searchParams: Promise.resolve({ cursor: 'invalid!', q: 'steel' }) }));
  expect(html).toContain('This catalog page link is invalid'); expect(html).toContain('/catalog?q=steel');
  expect(renderToStaticMarkup(await Gallery({ searchParams: Promise.resolve({ cursor: 'invalid!' }) }))).toContain('Return to first page'); expect(serverClient).not.toHaveBeenCalled();
});
