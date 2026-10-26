import 'server-only';
import { sortedReportPage } from '@/features/reports/sorted-page';
import { readSort,sortCursor,sortFilter } from '@/lib/api-sort';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseCursor } from '@/features/operations/services';
import { databaseError } from '@/lib/api';
export type StaffRow={id:string;display_name:string;disabled:boolean;created_at:string;user_roles:{role_id:string}[]};
export async function userPage(db:SupabaseClient,params:URLSearchParams){
 if(params.get('sort')==='roles')return sortedReportPage(db,'staff',params);
 const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??100),cursor=params.get('cursor')&&!params.has('sort')&&!params.has('direction')?parseCursor(params.get('cursor')!):null;
 const sort=readSort(params,["created_at","display_name","disabled"]);
 let query=db.from('profiles').select('id,display_name,disabled,created_at,user_roles(role_id)').order(sort.key,{ascending:sort.ascending,nullsFirst:false}).order('id',{ascending:sort.ascending}).limit(limit+1);
 if(sort.explicit&&params.get('cursor'))query=query.or(sortFilter(params.get('cursor')!,sort));
 if(cursor)query=query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
 const {data,error}=await query;databaseError(error);const rows=(data??[]) as StaffRow[],items=rows.slice(0,limit),last=items.at(-1);
 return {items,nextCursor:rows.length>limit&&last?(sort.explicit?sortCursor(last,sort):Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url')):null};
}
