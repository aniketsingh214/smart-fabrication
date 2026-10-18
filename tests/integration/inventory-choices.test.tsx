import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Inventory from '@/app/admin/inventory/page';
import { WorkOrderChoice } from '@/features/inventory/work-order-choice';
import { serverClient } from '@/lib/supabase/server';
import { StockForm } from '@/features/inventory/stock-form';
vi.mock('@/lib/supabase/server', () => ({ serverClient: vi.fn() }));
vi.mock('@/features/inventory/stock-form', () => ({ StockForm: vi.fn(() => null) }));
it('exposes work order continuation beyond 100 instead of silently truncating choices', async () => {
  const jobs = Array.from({ length: 101 }, (_, index) => ({ id: crypto.randomUUID(), name: `Job ${index}`, created_at: '2026-10-16T00:00:00.123456Z' }));
  const query = { select: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: jobs, error: null }) }; query.select.mockReturnValue(query); query.order.mockReturnValue(query);
  const db = { auth: { getUser: async () => ({ data: { user: { id: crypto.randomUUID() } } }) }, rpc: async (name: string) => ({ data: name === 'has_permission' ? true : name === 'my_permissions' ? ['inventory.approve'] : [], error: null }), from: vi.fn(() => query) };
  vi.mocked(serverClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof serverClient>>);
  renderToStaticMarkup(await Inventory());
  const props = vi.mocked(StockForm).mock.calls[0][0]; expect(props.jobs).toHaveLength(100);
  expect(JSON.parse(Buffer.from(props.jobsCursor!, 'base64url').toString('utf8'))).toEqual({ created_at: jobs[99].created_at, id: jobs[99].id });
  expect(query.order).toHaveBeenCalledWith('id', { ascending: false }); expect(query.limit).toHaveBeenCalledWith(101);
});
it('retains an unresolved work order selection even when it is outside the loaded page', () => {
  const selected = crypto.randomUUID(), html = renderToStaticMarkup(<WorkOrderChoice jobs={[]} cursor="opaque" selected={selected}/>);
  expect(html).toContain(`value="${selected}" selected=""`); expect(html).toContain('Saved work order (not in loaded page)'); expect(html).toContain('More work orders'); expect(html).toContain('type="button"');
});
