import 'server-only';
import { readSort,sortCursor,sortFilter } from '@/lib/api-sort';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { databaseError } from '@/lib/api';
import { parseCursor } from '@/features/operations/services';
export type NotificationRow={id:string;name:string;body:string|null;read_at:string|null;created_at:string};
export async function notificationPage(db:SupabaseClient,userId:string,params:URLSearchParams){
 const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25);
 const cursor=params.get('cursor')&&!params.has('sort')&&!params.has('direction')?parseCursor(params.get('cursor')!):null;
 const sort=readSort(params,["created_at","name","read_at"]);sort.nullsFirst=sort.key==='read_at'&&!sort.ascending;
 let query=db.from('notifications').select('id,name,body,read_at,created_at').eq('user_id',userId).order(sort.key,{ascending:sort.ascending,nullsFirst:sort.nullsFirst}).order('id',{ascending:sort.ascending}).limit(limit+1);
 if(sort.explicit&&params.get('cursor'))query=query.or(sortFilter(params.get('cursor')!,sort));
 if(cursor)query=query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
 const {data,error}=await query;databaseError(error);
 const rows=(data??[]) as NotificationRow[],items=rows.slice(0,limit),last=items.at(-1);
 return {items,nextCursor:rows.length>limit&&last?(sort.explicit?sortCursor(last,sort):Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url')):null};
}
