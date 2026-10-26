import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { readSort } from '@/lib/api-sort';
import { AppError } from '@/lib/errors';
import { databaseError } from '@/lib/api';
const cursorSchema=z.object({report:z.string(),target:z.string().nullable(),key:z.string(),direction:z.enum(['asc','desc']),offset:z.number().int().min(0).max(100000)}).strict();
export async function sortedReportPage(db:SupabaseClient,report:string,params:URLSearchParams,target:string|null=null){
 const sort=readSort(params,report==='staff'?['roles']:report==='statement'?['created_at','kind','reference','delta_minor']:['name','total_minor','earned_minor','paid_minor','returned_minor','outstanding_minor']);
 const direction=sort.ascending?'asc':'desc',limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??(report==='staff'?100:25));let offset=0;
 if(params.has('cursor')){try{const raw=params.get('cursor')!;if(raw.length>1024||!/^[A-Za-z0-9_-]+$/.test(raw))throw new Error();const c=cursorSchema.parse(JSON.parse(Buffer.from(raw,'base64url').toString('utf8')));if(c.report!==report||c.target!==target||c.key!==sort.key||c.direction!==direction)throw new Error();offset=c.offset;}catch{throw new AppError('INVALID_CURSOR','Invalid report sort cursor',422);}}
 const {data,error}=await db.rpc('sorted_report_page',{report_name:report,sort_key:sort.key,sort_direction:direction,page_offset:offset,page_limit:limit,target});databaseError(error);
 return {items:report==='staff'?data.items.map((row:Record<string,unknown>)=>{const safe={...row};delete safe.roles;return safe;}):data.items,nextCursor:data.next_offset==null?null:Buffer.from(JSON.stringify({report,target,key:sort.key,direction,offset:data.next_offset})).toString('base64url')};
}
