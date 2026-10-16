import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type Resource,resourceSchema } from '@/contracts/resources';
import { databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
const cursorSchema=z.object({created_at:z.iso.datetime({offset:true}),id:z.uuid()}).strict();
import { recordFields } from '@/contracts/resource-projections';
export { recordFields } from '@/contracts/resource-projections';
export function parseCursor(value:string){try{if(value.length>512||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error();return cursorSchema.parse(JSON.parse(Buffer.from(value,'base64url').toString('utf8')));}catch{throw new AppError('INVALID_CURSOR','Invalid pagination cursor',422);}}
export async function customerOrders(db:SupabaseClient,params:URLSearchParams,id?:string){const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25),cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;const {data,error}=await db.rpc('my_orders',{target:id?z.uuid().parse(id):null,after_created:cursor?.created_at??null,after_id:cursor?.id??null,page_limit:limit+1,text_filter:params.get('q'),status_filter:params.get('status')});databaseError(error);const rows=(data??[]) as Record<string,unknown>[],items=rows.slice(0,limit),last=items.at(-1);return {items,nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};}
export async function customerQuotations(db:SupabaseClient,params:URLSearchParams,id?:string){const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25),cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;const {data,error}=await db.rpc('my_quotation_page',{target:id?z.uuid().parse(id):null,after_created:cursor?.created_at??null,after_id:cursor?.id??null,page_limit:limit+1,text_filter:params.get('q'),status_filter:params.get('status')});databaseError(error);const rows=(data??[]) as Record<string,unknown>[],items=rows.slice(0,limit),last=items.at(-1);return {items,nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};}
export async function listRecords(db:SupabaseClient,resource:Resource,params:URLSearchParams,publicOnly=false){
  const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25);
  let query=db.from(resource.table).select(recordFields(resource)).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
  if(publicOnly){if(resource.slug==='categories')query=query.eq('active',true);else query=query.eq('status','published');}
  const q=params.get('q');if(q){const searchKey=resource.fields.some(f=>f.key==='name')?'name':resource.fields.some(f=>f.key==='heading')?'heading':resource.slug==='media-assets'?'public_id':resource.slug==='audit-logs'?'entity_type':null;if(!searchKey)throw new AppError('UNSUPPORTED_FILTER','This resource does not support text search',422);const safe=q.replace(/[%_\\]/g,'').slice(0,120);query=query.ilike(searchKey,`%${safe}%`);}
  if(params.get('status')&&!publicOnly)query=query.eq('status',params.get('status'));
  if(params.get('cursor')){const c=parseCursor(params.get('cursor')!);query=query.or(`created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`);}
  const {data,error}=await query;databaseError(error);const rows=(data??[]) as unknown as Record<string,unknown>[],hasMore=rows.length>limit;const items=rows.slice(0,limit),last=items.at(-1);
  return {items,nextCursor:hasMore&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};
}
export async function createRecord(db:SupabaseClient,resource:Resource,input:unknown,idempotencyKey?:string|null){
  if(resource.readOnly)throw new AppError('METHOD_NOT_ALLOWED','Use the workflow action for this resource',405);
  const payload=resourceSchema(resource).parse(input);
  if(['products','product-variants'].includes(resource.slug)&&Number(payload.price_max_minor)<Number(payload.price_min_minor))throw new AppError('VALIDATION_ERROR','Maximum price must cover starting price',422);
  if(resource.slug==='reviews'&&Number(payload.rating)>5)throw new AppError('VALIDATION_ERROR','Rating must be between 1 and 5',422);
  if(resource.rpc){
    if(resource.rpc.startsWith('payment:')||['work-entries','owner-withdrawals','expense-reversals'].includes(resource.slug)){if(!idempotencyKey)throw new AppError('IDEMPOTENCY_REQUIRED','Idempotency-Key header is required',422);payload.idempotency_key=z.uuid().parse(idempotencyKey);}
    const {data,error}=resource.rpc.startsWith('payment:')?await db.rpc('post_payment',{payment_kind:resource.rpc.split(':')[1],payload}):await db.rpc(resource.rpc,{payload});databaseError(error);return {id:data};
  }
  const {data,error}=await db.from(resource.table).insert(payload).select(recordFields(resource)).single();databaseError(error);return data;
}
export async function updateRecord(db:SupabaseClient,resource:Resource,id:string,input:unknown){
  z.uuid().parse(id);if(resource.readOnly||resource.appendOnly||resource.rpc||['measurements','labour-rates'].includes(resource.slug))throw new AppError('METHOD_NOT_ALLOWED','This history is immutable; create a new record',405);
  const payload=resourceSchema(resource,true).parse(input);if(!Object.keys(payload).length)throw new AppError('VALIDATION_ERROR','No changes were submitted',422);
  const {data,error}=await db.from(resource.table).update(payload).eq('id',id).select(recordFields(resource)).maybeSingle();databaseError(error);if(!data)throw new AppError('NOT_FOUND','Record not found',404);return data;
}





