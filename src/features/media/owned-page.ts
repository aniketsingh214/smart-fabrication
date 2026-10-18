import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseCursor } from '@/features/operations/services';
import { databaseError } from '@/lib/api';
export async function ownedMediaPage(db: SupabaseClient, ownerId: string, params: URLSearchParams) {
  const limit = z.coerce.number().int().min(1).max(100).parse(params.get('limit') ?? 100), cursor = params.get('cursor') ? parseCursor(params.get('cursor')!) : null;
  let query = db.from('media_assets').select('id,public_id,context,visibility,resource_type,format,created_at').eq('owner_user_id', ownerId).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit + 1);
  if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  const { data, error } = await query; databaseError(error);
  const items = (data ?? []).slice(0, limit), last = items.at(-1);
  return { items, nextCursor: data && data.length > limit && last ? Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString('base64url') : null };
}
