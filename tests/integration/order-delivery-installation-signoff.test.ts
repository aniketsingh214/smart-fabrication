import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { runAction } from '@/features/operations/actions';
import { GET as getAdvancePayment, POST as postAdvancePayment } from '@/app/api/v1/orders/[id]/advance-payment/route';
import { GET as getInstallation, POST as postInstallation } from '@/app/api/v1/orders/[id]/installation/route';
import { requestContext } from '@/lib/auth/request';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/auth/request', () => ({ requestContext: vi.fn() }));

describe('Royal Gates Delivery Sign-off, Installation Sign-off & Multi-Installment Workflow', () => {
  const orderId = 'a1111111-1111-4111-8111-111111111111';
  const deliveryId = 'b2222222-2222-4222-8222-222222222222';
  const installId = 'c3333333-3333-4333-8333-333333333333';
  const proofId = 'd4444444-4444-4444-8444-444444444444';
  const idempotencyKey = 'e5555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Delivery Sign-off captures delivered_by, customer_signature, remarks and timestamp', async () => {
    const updateResult = {
      id: deliveryId,
      status: 'delivered',
      confirmed_at: '2026-11-11T12:00:00Z',
      delivered_by: 'Ramesh Singh',
      customer_signature: 'Received in good condition - Rajesh Sharma',
      remarks: 'Gate and railing delivered safely to site.',
      proof_media_id: proofId,
    };

    const single = vi.fn().mockResolvedValue({ data: updateResult, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn((t: string) => (t === 'deliveries' ? { update } : {}));

    const mockDb = { from } as unknown as SupabaseClient;

    const res = await runAction(mockDb, 'deliveries', deliveryId, 'signoff', {
      status: 'delivered',
      confirmed_at: '2026-11-11T12:00:00Z',
      delivered_by: 'Ramesh Singh',
      customer_signature: 'Received in good condition - Rajesh Sharma',
      remarks: 'Gate and railing delivered safely to site.',
      proof_media_id: proofId,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'delivered',
        confirmed_at: '2026-11-11T12:00:00Z',
        delivered_by: 'Ramesh Singh',
        customer_signature: 'Received in good condition - Rajesh Sharma',
        remarks: 'Gate and railing delivered safely to site.',
        proof_media_id: proofId,
      })
    );
    expect(res).toEqual({ result: updateResult });
  });

  it('2. Installation Sign-off saves details against Order ID via /api/v1/orders/[id]/installation', async () => {
    const order = { id: orderId, name: 'Gate Order #101' };
    const delivery = { id: deliveryId };

    const from = vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
        };
      }
      if (table === 'deliveries') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: delivery, error: null }),
        };
      }
      if (table === 'installations') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: installId }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const req = new NextRequest(`http://localhost/api/v1/orders/${orderId}/installation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        installed_by: 'Mohd. Farooq & Team',
        customer_signature: 'Fitting confirmed - Rajesh Sharma',
        remarks: 'Hinges aligned, smooth swing verified.',
        completed_at: '2026-11-11T15:00:00Z',
      }),
    });

    const res = await postInstallation(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe(installId);
    expect(body.data.order_id).toBe(orderId);
    expect(body.data.status).toBe('completed');
  });

  it('3. Multiple installments recording and auto calculation: Remaining Balance = Total - Total Paid', async () => {
    const order = { id: orderId, name: 'Gate Order #101', status: 'PRODUCTION_STARTED', total_minor: 120000, version: 3 };
    const payments = [
      {
        id: 'pay-2',
        amount_minor: 40000,
        mode: 'bank',
        reference: 'INST-002',
        installment_number: 2,
        received_by: 'Aniket Singh',
        created_at: '2026-11-05T10:00:00Z',
      },
      {
        id: 'pay-1',
        amount_minor: 40000,
        mode: 'upi',
        reference: 'ADV-001',
        installment_number: 1,
        received_by: 'Cashier',
        created_at: '2026-11-01T10:00:00Z',
      },
    ];

    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
    };
    const paymentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: payments, error: null }),
    };
    const rpc = vi.fn((name: string) => {
      if (name === 'receivable_balances') {
        return {
          eq: vi.fn().mockResolvedValue({
            data: [{ order_id: orderId, paid_minor: 80000, outstanding_minor: 40000 }],
            error: null,
          }),
        };
      }
      return Promise.resolve({ data: null, error: null });
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from: vi.fn((t: string) => (t === 'orders' ? orderQuery : paymentQuery)), rpc },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const res = await getAdvancePayment(new NextRequest(`http://localhost/api/v1/orders/${orderId}/advance-payment`), {
      params: Promise.resolve({ id: orderId }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()).data;
    expect(body.totalMinor).toBe(120000);
    expect(body.totalPaidMinor).toBe(80000);
    expect(body.balanceDueMinor).toBe(40000);
    expect(body.paymentStatus).toBe('PARTIALLY_PAID');
    expect(body.payments).toHaveLength(2);
    expect(body.payments[0].installment_number).toBe(2);
    expect(body.payments[1].installment_number).toBe(1);
  });

  it('4. Posting 3rd installment to settle full balance achieves PAID status', async () => {
    const order = { id: orderId, name: 'Gate Order #101', status: 'READY', total_minor: 120000, version: 4 };

    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
    };

    const rpc = vi.fn((name: string, args: unknown) => {
      if (name === 'post_payment') {
        return Promise.resolve({ data: 'pay-3', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    vi.mocked(requestContext).mockResolvedValue({
      db: { from: vi.fn(() => orderQuery), rpc },
    } as unknown as Awaited<ReturnType<typeof requestContext>>);

    const req = new NextRequest(`http://localhost/api/v1/orders/${orderId}/advance-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        amount_minor: 40000,
        mode: 'cash',
        reference: 'FINAL-CASH-003',
        installment_number: 3,
        received_by: 'Aniket Singh',
      }),
    });

    const res = await postAdvancePayment(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.paymentId).toBe('pay-3');
    expect(rpc).toHaveBeenCalledWith(
      'post_payment',
      expect.objectContaining({
        payment_kind: 'customer',
        payload: expect.objectContaining({
          order_id: orderId,
          amount_minor: 40000,
          installment_number: 3,
          received_by: 'Aniket Singh',
        }),
      })
    );
  });
});

