import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { quotationPdf } from '@/features/quotations/document';
import { GET } from '@/app/api/v1/quotations/[id]/pdf/route';
vi.mock('@/lib/auth/request', () => ({ requestContext: vi.fn() }));
vi.mock('@/features/quotations/document', () => ({ quotationPdf: vi.fn(async () => Buffer.from('%PDF-fixture')) }));
const id = crypto.randomUUID();
const version = { version: 2, total_minor: 100, snapshot: {} };
let query: { eq: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.clearAllMocks();
  const chain = (data: unknown) => {
    const q = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(async () => ({ data, error: null })) };
    for (const name of ['select', 'eq', 'order', 'limit'] as const) q[name].mockReturnValue(q);
    return q;
  };
  query = chain(version);
  const quote = chain({ name: 'Gate', status: 'approved', expires_at: '2026-12-01' });
  vi.mocked(requestContext).mockResolvedValue({ db: { from: (table: string) => table === 'quotations' ? quote : query } } as unknown as Awaited<ReturnType<typeof requestContext>>);
});
it('renders the requested immutable version, scoped to its parent quotation', async () => {
  const response = await GET(new NextRequest(`http://localhost/api/v1/quotations/${id}/pdf?version=2`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(200);
  expect(query.eq).toHaveBeenCalledWith('quotation_id', id);
  expect(query.eq).toHaveBeenCalledWith('version', 2);
  expect(quotationPdf).toHaveBeenCalledWith(expect.anything(), version);
  expect(response.headers.get('Content-Disposition')).toContain('-v2.pdf');
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});
it('retains latest-visible-version behavior when no selector is supplied', async () => {
  expect((await GET(new NextRequest(`http://localhost/api/v1/quotations/${id}/pdf`), { params: Promise.resolve({ id }) })).status).toBe(200);
  expect(query.eq).not.toHaveBeenCalledWith('version', expect.anything());
});
it.each(['0', '-1', '1.5', 'abc', '2147483648'])('rejects invalid version %s before database access', async value => {
  expect((await GET(new NextRequest(`http://localhost/api/v1/quotations/${id}/pdf?version=${value}`), { params: Promise.resolve({ id }) })).status).toBe(422);
  expect(requestContext).not.toHaveBeenCalled();
});
