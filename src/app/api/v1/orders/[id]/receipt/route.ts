import { databaseError, failure } from '@/lib/api';
import { requestContext } from '@/lib/auth/request';
import { AppError } from '@/lib/errors';
import { advanceReceiptPdf } from '@/features/orders/advance-receipt-document';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const { db } = await requestContext(request, ['orders.read', 'finance.read']);

    // 1. Fetch order details
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select('id, name, status, total_minor, quotation_version_id, created_at')
      .eq('id', id)
      .maybeSingle();
    databaseError(orderErr);
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    // 2. Fetch customer details via quotation_version
    let customer: { name?: string | null; phone?: string | null; email?: string | null; address?: string | null } | null = null;
    if (order.quotation_version_id) {
      const { data: qv } = await db
        .from('quotation_versions')
        .select('quotation_id')
        .eq('id', order.quotation_version_id)
        .maybeSingle();
      if (qv?.quotation_id) {
        const { data: q } = await db
          .from('quotations')
          .select('customer_id')
          .eq('id', qv.quotation_id)
          .maybeSingle();
        if (q?.customer_id) {
          const { data: c } = await db
            .from('customers')
            .select('name, phone, email, address')
            .eq('id', q.customer_id)
            .maybeSingle();
          if (c) customer = c;
        }
      }
    }

    // 3. Fetch customer_payments for this order
    const paymentId = request.nextUrl.searchParams.get('payment_id');
    const { data: payments, error: payErr } = await db
      .from('customer_payments')
      .select('id, amount_minor, mode, reference, created_at')
      .eq('order_id', id)
      .order('created_at', { ascending: false });
    databaseError(payErr);

    if (!payments || payments.length === 0) {
      throw new AppError('NOT_FOUND', 'No advance payments found for this order', 404);
    }

    const activePayment = paymentId
      ? payments.find((p) => p.id === paymentId) || payments[0]
      : payments[0];

    const {data:balances,error:balanceError}=await db.rpc('receivable_balances').eq('order_id',id);
    databaseError(balanceError);
    const balance=(balances??[]).find((row:{order_id:string})=>row.order_id===id);
    if(!balance)throw new AppError('FORBIDDEN','Order payment balance is not available for this account',403);
    const totalPaidMinor=Number(balance.paid_minor);
    const balanceDueMinor=Math.max(0,Number(balance.outstanding_minor));

    const buffer = await advanceReceiptPdf({
      order: {
        id: order.id,
        name: order.name,
        status: order.status,
        total_minor: Number(order.total_minor),
        created_at: order.created_at,
      },
      customer,
      payment: {
        id: activePayment.id,
        amount_minor: Number(activePayment.amount_minor),
        mode: activePayment.mode,
        reference: activePayment.reference,
        created_at: activePayment.created_at,
      },
      totalPaidMinor,
      balanceDueMinor,
    });

    const filename = `advance-receipt-${order.id.slice(0, 8)}-${activePayment.id.slice(0, 4)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Request-ID': requestId,
      },
    });
  } catch (e) {
    return failure(e, requestId);
  }
}
