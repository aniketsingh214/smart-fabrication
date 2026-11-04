import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { runAction } from '@/features/operations/actions';
import { updateRecord } from '@/features/operations/services';
import { resourceMap } from '@/contracts/resources';
import { GET, POST } from '@/app/api/v1/orders/[id]/advance-payment/route';
import { requestContext } from '@/lib/auth/request';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/auth/request', () => ({ requestContext: vi.fn() }));

describe('Royal Gates Two-Payment, Dispatch, Delivery and Installation Workflow', () => {
  const orderId = 'a1111111-1111-4111-8111-111111111111';
  const deliveryId = 'b2222222-2222-4222-8222-222222222222';
  const installId = 'c3333333-3333-4333-8333-333333333333';
  const proofId = 'd4444444-4444-4444-8444-444444444444';
  const idempotencyKey = 'e5555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 1: Order confirmed with advance payment allows production to begin (transitions to ADVANCE_RECEIVED)', async () => {
    const order = { id: orderId, name: 'Gate Order #101', status: 'CONFIRMED', total_minor: 100000, version: 1 };
    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
    };
    const paymentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockResolvedValue({
            data: [{ order_id: orderId, paid_minor: 0, outstanding_minor: 100000 }],
            error: null,
          }),
        };
      }
      return Promise.resolve({ data: idempotencyKey, error: null });
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from: vi.fn((t: string) => (t === 'orders' ? orderQuery : paymentQuery)), rpc },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const req = new NextRequest(`http://localhost/api/v1/orders/${orderId}/advance-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ amount_minor: 30000, mode: 'upi', reference: 'ADV-UPI-101' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('ADVANCE_RECEIVED');
    expect(rpc).toHaveBeenCalledWith(
      'transition_order',
      expect.objectContaining({
        target: orderId,
        next_status: 'ADVANCE_RECEIVED',
        expected_version: 1,
      })
    );
  });

  it('Scenario 2: Production completed but balance remains -> dispatch is strictly blocked with exact prompt error', async () => {
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { order_id: orderId, total_minor: 100000, paid_minor: 30000, outstanding_minor: 70000 },
              error: null,
            }),
          }),
        };
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mockDb = { rpc } as unknown as SupabaseClient;

    await expect(
      runAction(mockDb, 'orders', orderId, 'transitions', { status: 'OUT_FOR_DELIVERY', version: 3 })
    ).rejects.toMatchObject({
      message: '100% payment is required before dispatch. Please complete the Next Payment (ALL DONE).',
      status: 422,
    });
    expect(rpc).not.toHaveBeenCalledWith('transition_order', expect.anything());
  });

  it('Scenario 3 & 4: Full payment received marked as PAID - ALL DONE, enabling dispatch after production', async () => {
    const order = { id: orderId, name: 'Gate Order #101', status: 'READY', total_minor: 100000, version: 5 };
    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
    };
    const paymentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: idempotencyKey, amount_minor: 70000, mode: 'bank', reference: 'FULL-002', created_at: '2026-11-04T10:00:00Z' },
          { id: 'pay-1', amount_minor: 30000, mode: 'upi', reference: 'ADV-001', created_at: '2026-11-01T10:00:00Z' },
        ],
        error: null,
      }),
    };
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockResolvedValue({
            data: [{ order_id: orderId, paid_minor: 100000, outstanding_minor: 0 }],
            error: null,
          }),
        };
      }
      return Promise.resolve({ data: null, error: null });
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from: vi.fn((t: string) => (t === 'orders' ? orderQuery : paymentQuery)), rpc },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const getRes = await GET(new NextRequest(`http://localhost/api/v1/orders/${orderId}/advance-payment`), {
      params: Promise.resolve({ id: orderId }),
    });
    expect(getRes.status).toBe(200);
    const getData = (await getRes.json()).data;
    expect(getData.paymentStatus).toBe('PAID - ALL DONE');
    expect(getData.isPaidAllDone).toBe(true);
    expect(getData.balanceDueMinor).toBe(0);
    expect(getData.isDispatchEligible).toBe(true);
  });

  it('Scenario 6: Full payment and production completed: dispatch is allowed', async () => {
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { order_id: orderId, total_minor: 100000, paid_minor: 100000, outstanding_minor: 0 },
              error: null,
            }),
          }),
        };
      }
      if (name === 'transition_order') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mockDb = { rpc } as unknown as SupabaseClient;

    const res = await runAction(mockDb, 'orders', orderId, 'transitions', { status: 'OUT_FOR_DELIVERY', version: 5 });
    expect(rpc).toHaveBeenCalledWith('transition_order', {
      target: orderId,
      next_status: 'OUT_FOR_DELIVERY',
      expected_version: 5,
      note: '',
    });
    expect(res).toEqual({ result: null });
  });

  it('Scenario 7: Extra payment rejected if order is already PAID - ALL DONE (balance = 0)', async () => {
    const order = { id: orderId, name: 'Gate Order #101', status: 'READY', total_minor: 100000, version: 5 };
    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
    };
    const rpc = vi.fn((name: string) => {
      if (name === 'post_payment') {
        return Promise.resolve({ data: null, error: { code: 'P0001', message: 'Payment exceeds outstanding balance' } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from: vi.fn(() => orderQuery), rpc },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const req = new NextRequest(`http://localhost/api/v1/orders/${orderId}/advance-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ amount_minor: 10000, mode: 'upi', reference: 'EXTRA-PAY' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body.error.message).toContain('Payment exceeds outstanding balance');
  });

  it('Scenario 8: Delivery without customer sign-off cannot be completed', async () => {
    const mockDb = {
      from: vi.fn(),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;

    await expect(
      runAction(mockDb, 'deliveries', deliveryId, 'transitions', { status: 'delivered' })
    ).rejects.toMatchObject({
      message: 'Customer delivery sign-off is required before completing delivery.',
      status: 422,
    });
    expect(mockDb.from).not.toHaveBeenCalled();
  });

  it('Scenario 9: Installation without customer sign-off cannot be completed', async () => {
    const mockDb = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { customer_confirmed: false }, error: null }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      updateRecord(mockDb, resourceMap.installations!, installId, { status: 'completed', customer_confirmed: false })
    ).rejects.toMatchObject({
      message: 'Customer installation sign-off is required before completing installation.',
      status: 422,
    });
  });

  it('Scenario 10: Payment complete but order completion attempted with balance remaining is rejected', async () => {
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { order_id: orderId, total_minor: 100000, paid_minor: 60000, outstanding_minor: 40000 },
              error: null,
            }),
          }),
        };
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mockDb = { rpc } as unknown as SupabaseClient;

    await expect(
      runAction(mockDb, 'orders', orderId, 'transitions', { status: 'COMPLETED', version: 8 })
    ).rejects.toMatchObject({
      message: 'Order cannot be completed. Please finish all pending workflow stages and obtain the required customer sign-offs.',
      status: 422,
    });
  });

  it('Scenario 11: All workflow stages and sign-offs complete: order can transition to COMPLETED', async () => {
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { order_id: orderId, total_minor: 100000, paid_minor: 100000, outstanding_minor: 0 },
              error: null,
            }),
          }),
        };
      }
      if (name === 'transition_order') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mockDb = { rpc } as unknown as SupabaseClient;

    const res = await runAction(mockDb, 'orders', orderId, 'transitions', { status: 'COMPLETED', version: 8 });
    expect(rpc).toHaveBeenCalledWith('transition_order', {
      target: orderId,
      next_status: 'COMPLETED',
      expected_version: 8,
      note: '',
    });
    expect(res).toEqual({ result: null });
  });

  it('Scenario 12: Delivery with proof and customer confirmation succeeds', async () => {
    const updateResult = { id: deliveryId, status: 'delivered', proof_media_id: proofId, confirmed_at: '2026-11-04T12:00:00Z' };
    const single = vi.fn().mockResolvedValue({ data: updateResult, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn((t: string) => (t === 'deliveries' ? { update } : {}));

    const mockDb = { from } as unknown as SupabaseClient;

    const res = await runAction(mockDb, 'deliveries', deliveryId, 'transitions', {
      status: 'delivered',
      proof_media_id: proofId,
      confirmed_at: '2026-11-04T12:00:00Z',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'delivered',
        proof_media_id: proofId,
        confirmed_at: '2026-11-04T12:00:00Z',
      })
    );
    expect(res).toEqual({ result: updateResult });
  });
});
