import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { success, failure, databaseError, jsonBody } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params; z.uuid().parse(id);
    const cursor = z.uuid().nullable().parse(request.nextUrl.searchParams.get('cursor'));
    const { db } = await requestContext(request, 'purchases.read');
    const permission = await db.rpc('has_permission', { requested: 'finance.read' });
    if (permission.error || !permission.data) throw new AppError('FORBIDDEN', 'Finance read permission is required', 403);
    let query = db.from('purchase_attachments').select('id,media_id,note,created_at').eq('purchase_id', id).order('id').limit(26);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    databaseError(error); const items = data?.slice(0, 25) ?? [];
    return success(items, requestId, 200, { nextCursor: data && data.length > 25 ? items.at(-1)?.id : null });
  } catch (error) { return failure(error, requestId); }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params; z.uuid().parse(id);
    const body = z.object({ media_id: z.uuid(), note: z.string().trim().max(500).default('') }).strict().parse(await jsonBody(request));
    const { db } = await requestContext(request, 'purchases.write');
    const { data, error } = await db.rpc('attach_purchase_invoice', { target: id, asset_id: body.media_id, attachment_note: body.note });
    databaseError(error); return success({ id: data }, requestId, 201);
  } catch (error) { return failure(error, requestId); }
}
