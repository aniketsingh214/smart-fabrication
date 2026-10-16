import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { databaseError } from '@/lib/api';
import { parseCursor } from '@/features/operations/services';
export type NotificationRow={id:string;name:string;body:string|null;read_at:string|null;created_at:string};
export async function notificationPage(db:SupabaseClient,userId:string,params:URLSearchParams){
 const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25);
 const cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;
 let query=db.from('notifications').select('id,name,body,read_at,created_at').eq('user_id',userId).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
 if(cursor)query=query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
 const {data,error}=await query;databaseError(error);
 const rows=(data??[]) as NotificationRow[],items=rows.slice(0,limit),last=items.at(-1);
 return {items,nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};
}
