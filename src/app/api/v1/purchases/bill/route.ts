import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { success, failure, jsonBody, databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { requestContext } from '@/lib/auth/request';
import { PRELOADED_MATERIAL_CATALOG } from '@/features/materials/material-catalog-data';

const billItemSchema = z.object({
  material_id: z.string().optional(),
  material_code: z.string().optional(),
  material_name: z.string().min(1),
  unit: z.enum(['kg', 'm', 'piece', 'litre', 'sheet']),
  quantity: z.number().positive(),
  rate_minor: z.number().int().nonnegative(), // rate in paisa per unit
  subtotal_minor: z.number().int().nonnegative(),
});

const purchaseBillSchema = z.object({
  supplier_id: z.string().uuid(),
  bill_number: z.string().min(1).max(100),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(billItemSchema).min(1, 'कम से कम एक सामान जोड़ना आवश्यक है (At least one line item required)'),
  paid_minor: z.number().int().nonnegative().default(0),
  payment_mode: z.enum(['cash', 'bank', 'upi', 'cheque']).default('cash'),
  payment_reference: z.string().max(200).optional(),
  auto_receive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { db } = await requestContext(request, 'purchases.write');
    const body = await jsonBody(request);
    const input = purchaseBillSchema.parse(body);

    // Calculate total
    const computedTotalMinor = input.items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.rate_minor),
      0
    );

    const purchaseName =
      input.name?.trim() ||
      `Bill #${input.bill_number} (${new Date(input.bill_date).toLocaleDateString('hi-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })})`;

    // 1. Insert Purchase Header
    const { data: purchase, error: purchaseError } = await db
      .from('purchases')
      .insert({
        supplier_id: input.supplier_id,
        bill_number: input.bill_number,
        bill_date: input.bill_date,
        name: purchaseName,
        total_minor: computedTotalMinor,
        status: 'draft',
      })
      .select('id, name, bill_number, bill_date, status, total_minor')
      .single();

    databaseError(purchaseError);
    if (!purchase) throw new AppError('DATABASE_ERROR', 'Failed to create purchase header', 500);

    const purchaseId = purchase.id;

    // 2. Resolve / ensure materials exist and insert Purchase Items
    for (const item of input.items) {
      let resolvedMaterialId = item.material_id;

      // If material_id is not a valid UUID or missing, look up by code or create from catalog
      if (!resolvedMaterialId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedMaterialId)) {
        const code = item.material_code || `MAT-${Date.now().toString(36).toUpperCase()}`;

        // Check if material with this code already exists
        const { data: existingMat } = await db
          .from('materials')
          .select('id')
          .eq('code', code)
          .maybeSingle();

        if (existingMat) {
          resolvedMaterialId = existingMat.id;
        } else {
          // Find specs from catalog or fallback
          const catalogItem = PRELOADED_MATERIAL_CATALOG.find((m) => m.code === code);
          const { data: newMat, error: newMatErr } = await db
            .from('materials')
            .insert({
              name: item.material_name,
              code,
              type: catalogItem?.type || 'angle',
              size: catalogItem?.size || item.material_name,
              thickness_mm: catalogItem?.thickness_mm || 1.0,
              unit: item.unit,
              weight_kg_per_unit: catalogItem?.weight_kg_per_unit || 1.0,
              reorder_level: catalogItem?.reorder_level || 5,
              active: true,
            })
            .select('id')
            .single();

          databaseError(newMatErr);
          resolvedMaterialId = newMat?.id;
        }
      }

      if (!resolvedMaterialId) {
        throw new AppError('INVALID_MATERIAL', `Material could not be resolved for ${item.material_name}`, 422);
      }

      // Insert purchase item
      const { error: itemErr } = await db.from('purchase_items').insert({
        purchase_id: purchaseId,
        material_id: resolvedMaterialId,
        quantity: item.quantity,
        rate_minor: item.rate_minor,
      });

      databaseError(itemErr);
    }

    // 3. Auto-receive if requested
    let finalStatus = 'draft';
    if (input.auto_receive) {
      const { error: receiveErr } = await db.rpc('receive_purchase', { target: purchaseId });
      databaseError(receiveErr);
      finalStatus = 'received';
    }

    // 4. Record initial supplier payment if paid_minor > 0
    let paymentId: string | undefined;
    if (input.paid_minor > 0) {
      if (input.paid_minor > computedTotalMinor) {
        throw new AppError('OVERPAYMENT', 'भुगतान की रकम बिल से अधिक नहीं हो सकती (Paid amount exceeds bill total)', 422);
      }

      // If purchase was auto-received, we can use post_payment RPC or direct insert if permissions allow
      if (finalStatus === 'received') {
        const { data: payResult, error: payErr } = await db.rpc('post_payment', {
          payment_kind: 'supplier',
          payload: {
            purchase_id: purchaseId,
            amount_minor: input.paid_minor,
            mode: input.payment_mode,
            reference: input.payment_reference?.trim() || `Bill #${input.bill_number} Payment`,
            idempotency_key: crypto.randomUUID(),
          },
        });
        databaseError(payErr);
        paymentId = payResult;
      }
    }

    return success(
      {
        id: purchaseId,
        bill_number: input.bill_number,
        bill_date: input.bill_date,
        total_minor: computedTotalMinor,
        paid_minor: input.paid_minor,
        status: finalStatus,
        payment_id: paymentId,
      },
      requestId,
      201
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
