import { databaseError, failure, jsonBody, success } from '@/lib/api';
import { requestContext } from '@/lib/auth/request';
import { AppError } from '@/lib/errors';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const advancePaymentSchema = z.object({
  amount_minor: z.number().int().positive('Payment amount must be greater than zero'),
  mode: z.enum(['cash', 'bank', 'upi', 'cheque']),
  reference: z.string().trim().min(1, 'Reference or transaction ID is required').max(200),
  gateway_ready: z.boolean().optional().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const { db } = await requestContext(request, ['orders.read', 'finance.read']);

    const [orderResult,paymentResult,balanceResult]=await Promise.all([
      db.from('orders').select('id, name, status, total_minor, version, created_at').eq('id',id).maybeSingle(),
      db.from('customer_payments').select('id, amount_minor, mode, reference, created_at').eq('order_id',id).order('created_at',{ascending:false}),
      db.rpc('receivable_balances').eq('order_id',id),
    ]);
    const {data:order,error:orderErr}=orderResult;
    databaseError(orderErr);
    if(!order)throw new AppError('NOT_FOUND','Order not found',404);
    const {data:payments,error:payErr}=paymentResult;
    databaseError(payErr);
    const {data:balances,error:balanceError}=balanceResult;
    databaseError(balanceError);
    const balance=(balances??[]).find((row:{order_id:string})=>row.order_id===id);
    if(!balance)throw new AppError('FORBIDDEN','Order payment balance is not available for this account',403);
    const totalPaidMinor=Number(balance.paid_minor);
    const balanceDueMinor=Math.max(0,Number(balance.outstanding_minor));

    return success(
      {
        orderId: order.id,
        orderName: order.name,
        status: order.status,
        version: order.version,
        totalMinor: Number(order.total_minor),
        totalPaidMinor,
        balanceDueMinor,
        payments: payments ?? [],
      },
      requestId
    );
  } catch (e) {
    return failure(e, requestId);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const { db } = await requestContext(request, ['orders.write', 'finance.write']);

    const raw = await jsonBody(request);
    const body = advancePaymentSchema.parse(raw);

    // 1. Fetch current order
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select('id, name, status, total_minor, version')
      .eq('id', id)
      .maybeSingle();
    databaseError(orderErr);
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    // 2. Record payment via post_payment RPC
    const idempotencyKey = z.uuid().parse(request.headers.get('Idempotency-Key')??crypto.randomUUID());
    const referenceText = body.gateway_ready
      ? `${body.reference} [Gateway Ready]`
      : body.reference;

    const { data: paymentId, error: postErr } = await db.rpc('post_payment', {
      payment_kind: 'customer',
      payload: {
        order_id: id,
        amount_minor: body.amount_minor,
        mode: body.mode,
        reference: referenceText,
        idempotency_key: idempotencyKey,
      },
    });
    databaseError(postErr);

    // 3. If order is in CONFIRMED state, automatically advance to ADVANCE_RECEIVED
    let newStatus = order.status;
    if (order.status === 'CONFIRMED') {
      const { error: transErr } = await db.rpc('transition_order', {
        target: id,
        next_status: 'ADVANCE_RECEIVED',
        expected_version: order.version,
        note: `Advance received: ${body.mode.toUpperCase()} (Ref: ${body.reference})`,
      });
      databaseError(transErr);
      newStatus = 'ADVANCE_RECEIVED';
    }

    return success(
      {
        paymentId,
        orderId: id,
        status: newStatus,
        receiptUrl: `/api/v1/orders/${id}/receipt?payment_id=${paymentId}`,
      },
      requestId,
      201
    );
  } catch (e) {
    return failure(e, requestId);
  }
}
