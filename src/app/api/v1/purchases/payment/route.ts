import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { success, failure, jsonBody, databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { requestContext } from '@/lib/auth/request';

const paymentSchema = z.object({
  supplier_id: z.string().uuid(),
  purchase_id: z.string().uuid().optional(),
  amount_minor: z.number().int().positive('भुगतान की राशि शून्य से अधिक होनी चाहिए (Positive amount required)'),
  mode: z.enum(['cash', 'bank', 'upi', 'cheque']).default('cash'),
  reference: z.string().min(1, 'रेफरेंस दर्ज करना आवश्यक है (Reference is required)').max(200),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { db } = await requestContext(request, 'finance.write');
    const body = await jsonBody(request);
    const input = paymentSchema.parse(body);

    let remainingMinor = input.amount_minor;
    const recordedPayments: Array<{ id: string; purchase_id: string; amount_minor: number }> = [];

    // CASE 1: Payment against a specific purchase
    if (input.purchase_id) {
      const { data: paymentId, error } = await db.rpc('post_payment', {
        payment_kind: 'supplier',
        payload: {
          purchase_id: input.purchase_id,
          amount_minor: input.amount_minor,
          mode: input.mode,
          reference: input.reference,
          idempotency_key: crypto.randomUUID(),
        },
      });

      databaseError(error);
      recordedPayments.push({
        id: paymentId,
        purchase_id: input.purchase_id,
        amount_minor: input.amount_minor,
      });
    } else {
      // CASE 2: Allocate payment across supplier's unpaid bills (FIFO)
      const { data: payables, error: payablesErr } = await db.rpc('payable_balances');
      databaseError(payablesErr);

      const supplierPayables = (payables ?? [])
        .filter((p: any) => p.supplier_id === input.supplier_id && Number(p.outstanding_minor) > 0)
        .sort((a: any, b: any) => (a.bill_date > b.bill_date ? 1 : -1));

      if (supplierPayables.length === 0) {
        throw new AppError('NO_DUE_BILLS', 'इस सप्लायर का कोई बकाया बिल उपलब्ध नहीं है (No outstanding bills found for this supplier)', 422);
      }

      for (const bill of supplierPayables) {
        if (remainingMinor <= 0) break;

        const billDue = Number(bill.outstanding_minor);
        const allocateMinor = Math.min(remainingMinor, billDue);

        if (allocateMinor > 0) {
          const { data: paymentId, error: postErr } = await db.rpc('post_payment', {
            payment_kind: 'supplier',
            payload: {
              purchase_id: bill.purchase_id,
              amount_minor: allocateMinor,
              mode: input.mode,
              reference: `${input.reference} (Allocated to ${bill.name || 'Bill'})`,
              idempotency_key: crypto.randomUUID(),
            },
          });

          databaseError(postErr);
          recordedPayments.push({
            id: paymentId,
            purchase_id: bill.purchase_id,
            amount_minor: allocateMinor,
          });

          remainingMinor -= allocateMinor;
        }
      }

      if (remainingMinor > 0) {
        // If there's surplus amount remaining after paying all received bills
        throw new AppError(
          'EXCESS_PAYMENT',
          `भुगतान राशि सभी बकाया बिलों से ₹${(remainingMinor / 100).toLocaleString('en-IN')} अधिक है।`,
          422
        );
      }
    }

    return success(
      {
        total_paid_minor: input.amount_minor,
        payments: recordedPayments,
      },
      requestId,
      201
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
