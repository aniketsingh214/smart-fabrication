import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseCursor } from '@/features/operations/services';
import { databaseError } from '@/lib/api';
export type StaffRow={id:string;display_name:string;disabled:boolean;created_at:string;user_roles:{role_id:string}[]};
export async function userPage(db:SupabaseClient,params:URLSearchParams){
 const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??100),cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;
 let query=db.from('profiles').select('id,display_name,disabled,created_at,user_roles(role_id)').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
 if(cursor)query=query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
 const {data,error}=await query;databaseError(error);const rows=(data??[]) as StaffRow[],items=rows.slice(0,limit),last=items.at(-1);
 return {items,nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};
}
