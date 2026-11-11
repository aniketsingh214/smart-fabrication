import { databaseError, failure, jsonBody, success } from '@/lib/api';
import { requestContext } from '@/lib/auth/request';
import { AppError } from '@/lib/errors';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const installationSignoffSchema = z.object({
  status: z.enum(['pending', 'completed']),
  installed_by: z.string().trim().max(200).optional().nullable(),
  customer_signature: z.string().trim().max(200).optional().nullable(),
  remarks: z.string().trim().max(2000).optional().nullable(),
  completed_at: z.string().optional().nullable(),
  customer_confirmed: z.boolean().optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  photos: z.array(z.string()).optional().default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const { db } = await requestContext(request, ['orders.read', 'delivery.read']);

    // Find installation linked directly by order_id or via delivery
    const { data: directIns, error: directErr } = await db
      .from('installations')
      .select('id, name, order_id, delivery_id, status, installed_by, customer_confirmed, customer_signature, remarks, completed_at, checklist, photos, created_at')
      .eq('order_id', id)
      .maybeSingle();
    databaseError(directErr);

    if (directIns) {
      return success(directIns, requestId);
    }

    // Fallback: look for deliveries associated with this order
    const { data: del, error: delErr } = await db
      .from('deliveries')
      .select('id')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .maybeSingle();
    databaseError(delErr);

    if (del) {
      const { data: viaIns, error: viaErr } = await db
        .from('installations')
        .select('id, name, order_id, delivery_id, status, installed_by, customer_confirmed, customer_signature, remarks, completed_at, checklist, photos, created_at')
        .eq('delivery_id', del.id)
        .maybeSingle();
      databaseError(viaErr);
      if (viaIns) {
        return success(viaIns, requestId);
      }
    }

    return success(null, requestId);
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
    const { db } = await requestContext(request, ['orders.write', 'delivery.write']);

    const raw = await jsonBody(request);
    const body = installationSignoffSchema.parse(raw);

    // 1. Fetch order
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
    databaseError(orderErr);
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    // 2. Fetch or create linked delivery for this order
    let { data: delivery, error: delErr } = await db
      .from('deliveries')
      .select('id')
      .eq('order_id', id)
      .maybeSingle();
    databaseError(delErr);

    if (!delivery) {
      const { data: newDel, error: createDelErr } = await db
        .from('deliveries')
        .insert({
          name: `Delivery for ${order.name}`,
          order_id: id,
          scheduled_at: new Date().toISOString(),
          address: 'Customer Site',
          crew: body.installed_by || 'Installation Crew',
          status: 'delivered',
          confirmed_at: body.completed_at ? new Date(body.completed_at).toISOString() : new Date().toISOString(),
          delivered_by: body.installed_by || 'Installation Crew',
          customer_signature: body.customer_signature || 'Confirmed',
          remarks: body.remarks || 'Direct installation delivery',
        })
        .select('id')
        .single();
      databaseError(createDelErr);
      if (!newDel) throw new AppError('INTERNAL', 'Failed to create delivery record', 500);
      delivery = newDel;
    }

    const deliveryId = delivery.id;

    // 3. Check if installation record already exists
    const { data: existingIns } = await db
      .from('installations')
      .select('id')
      .or(`order_id.eq.${id},delivery_id.eq.${deliveryId}`)
      .maybeSingle();

    const isCompleted = body.status === 'completed';
    const completionTimestamp = isCompleted
      ? body.completed_at
        ? new Date(body.completed_at).toISOString()
        : new Date().toISOString()
      : null;

    const payload = {
      name: `Installation - ${order.name}`,
      order_id: id,
      delivery_id: deliveryId,
      status: body.status,
      customer_confirmed: isCompleted ? true : Boolean(body.customer_confirmed),
      installed_by: body.installed_by || null,
      customer_signature: body.customer_signature || null,
      remarks: body.remarks || null,
      completed_at: completionTimestamp,
      checklist: body.checklist || {
        fixings_checked: true,
        alignment_checked: true,
        finish_checked: true,
        site_cleaned: true,
      },
      photos: body.photos || [],
    };

    let resultId = '';
    if (existingIns) {
      const { data: updated, error: updateErr } = await db
        .from('installations')
        .update(payload)
        .eq('id', existingIns.id)
        .select('id')
        .single();
      databaseError(updateErr);
      if (!updated) throw new AppError('INTERNAL', 'Failed to update installation record', 500);
      resultId = updated.id;
    } else {
      const { data: inserted, error: insertErr } = await db
        .from('installations')
        .insert(payload)
        .select('id')
        .single();
      databaseError(insertErr);
      if (!inserted) throw new AppError('INTERNAL', 'Failed to insert installation record', 500);
      resultId = inserted.id;
    }

    return success({ id: resultId, order_id: id, status: body.status }, requestId, 201);
  } catch (e) {
    return failure(e, requestId);
  }
}

