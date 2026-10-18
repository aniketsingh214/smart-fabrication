import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/purchases/[id]/attachments/route';
import { requestContext } from '@/lib/auth/request';
import { AppError } from '@/lib/errors';
vi.mock('@/lib/auth/request', () => ({ requestContext: vi.fn() }));
const purchase = crypto.randomUUID(), asset = crypto.randomUUID();
const params = () => ({ params: Promise.resolve({ id: purchase }) });
afterEach(() => vi.resetAllMocks());
function setup(rows: unknown[] = [], permission = true) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), gt: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve) };
  for (const key of ['select', 'eq', 'order', 'limit', 'gt'] as const) query[key].mockReturnValue(query);
  const rpc = vi.fn().mockResolvedValue({ data: permission, error: null }), from = vi.fn(() => query);
  vi.mocked(requestContext).mockResolvedValue({ db: { from, rpc } } as unknown as Awaited<ReturnType<typeof requestContext>>);
  return { query, rpc, from };
}
it('requires both purchase and finance read permissions before querying attachments', async () => {
  const { from } = setup([], false);
  expect((await GET(new NextRequest('http://localhost/api/v1/purchases/' + purchase + '/attachments'), params())).status).toBe(403);
  expect(requestContext).toHaveBeenCalledWith(expect.anything(), 'purchases.read'); expect(from).not.toHaveBeenCalled();
});
it('scopes every page to the purchase and exposes a 25-row continuation without overlap', async () => {
  const rows = Array.from({ length: 26 }, () => ({ id: crypto.randomUUID(), media_id: asset, note: '' })), { query } = setup(rows);
  const response = await GET(new NextRequest('http://localhost/attachments'), params()), body = await response.json();
  expect(body.data).toHaveLength(25); expect(body.meta.nextCursor).toBe(rows[24].id);
  expect(query.eq).toHaveBeenCalledWith('purchase_id', purchase); expect(query.order).toHaveBeenCalledWith('id'); expect(query.limit).toHaveBeenCalledWith(26);
  await GET(new NextRequest('http://localhost/attachments?cursor=' + rows[24].id), params());
  expect(query.gt).toHaveBeenCalledWith('id', rows[24].id);
});
it('rejects malformed cursor and overposted financial fields without touching the database', async () => {
  const { from, rpc } = setup();
  expect((await GET(new NextRequest('http://localhost/attachments?cursor=invalid'), params())).status).toBe(422);
  const request = new NextRequest('http://localhost/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: asset, note: '', total_minor: 0 }) });
  expect((await POST(request, params())).status).toBe(422); expect(from).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
it('delegates association to the authorized transactional RPC using only validated inputs', async () => {
  const { rpc } = setup(); const attachment = crypto.randomUUID(); rpc.mockResolvedValue({ data: attachment, error: null });
  const response = await POST(new NextRequest('http://localhost/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: asset, note: ' Original note ' }) }), params());
  expect(response.status).toBe(201); expect((await response.json()).data.id).toBe(attachment);
  expect(requestContext).toHaveBeenCalledWith(expect.anything(), 'purchases.write');
  expect(rpc).toHaveBeenCalledWith('attach_purchase_invoice', { target: purchase, asset_id: asset, attachment_note: 'Original note' });
});
it('propagates denied sessions and RPC authorization failures without claiming success', async () => {
  const { rpc } = setup(); rpc.mockResolvedValue({ data: null, error: { code: '42501' } } as never);
  const request = () => new NextRequest('http://localhost/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: asset }) });
  expect((await POST(request(), params())).status).toBe(403);
  vi.mocked(requestContext).mockRejectedValue(new AppError('UNAUTHORIZED', 'Sign in', 401));
  expect((await POST(request(), params())).status).toBe(401);
});
