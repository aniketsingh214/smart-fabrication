import {recordPrefixes} from '@/contracts/record-identity';
import {readLeadFilters,leadFilterKeys} from '@/contracts/lead-filters';
﻿import 'server-only';
import { salesSearchRPC } from '@/contracts/sales-search';
import { readSort,sortCursor,sortFilter } from '@/lib/api-sort';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type Resource,resourceSchema,resourceMap } from '@/contracts/resources';
import { parseRecordContext,recordRelation } from '@/contracts/record-context';
import { databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
const cursorSchema=z.object({created_at:z.iso.datetime({offset:true}),id:z.uuid()}).strict();
import { recordFields } from '@/contracts/resource-projections';
export { recordFields } from '@/contracts/resource-projections';
export function parseCursor(value:string){try{if(value.length>512||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error();return cursorSchema.parse(JSON.parse(Buffer.from(value,'base64url').toString('utf8')));}catch{throw new AppError('INVALID_CURSOR','Invalid pagination cursor',422);}}
async function withRecordCodes(db:SupabaseClient,table:string,items:Record<string,unknown>[]):Promise<Record<string,unknown>[]>{if(!items.length)return items;const {data,error}=await db.from(table).select('id,record_code').in('id',items.map(row=>row.id));databaseError(error);const codes=new Map((data??[]).map(row=>[row.id,row.record_code]));return items.map(row=>({...row,record_code:codes.get(row.id)??undefined}));}
export async function customerOrders(db:SupabaseClient,params:URLSearchParams,id?:string){const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25),cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;const {data,error}=await db.rpc('my_orders',{target:id?z.uuid().parse(id):null,after_created:cursor?.created_at??null,after_id:cursor?.id??null,page_limit:limit+1,text_filter:params.get('q'),status_filter:params.get('status')});databaseError(error);const rows=(data??[]) as Record<string,unknown>[],items=rows.slice(0,limit),last=items.at(-1);return {items:await withRecordCodes(db,'orders',items),nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};}
export async function customerQuotations(db:SupabaseClient,params:URLSearchParams,id?:string){const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25),cursor=params.get('cursor')?parseCursor(params.get('cursor')!):null;const {data,error}=await db.rpc('my_quotation_page',{target:id?z.uuid().parse(id):null,after_created:cursor?.created_at??null,after_id:cursor?.id??null,page_limit:limit+1,text_filter:params.get('q'),status_filter:params.get('status')});databaseError(error);const rows=(data??[]) as Record<string,unknown>[],items=rows.slice(0,limit),last=items.at(-1);return {items:await withRecordCodes(db,'quotations',items),nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null};}
export async function listRecords(db:SupabaseClient,resource:Resource,params:URLSearchParams,publicOnly=false){
  const limit=z.coerce.number().int().min(1).max(100).parse(params.get('limit')??25);
  const context=parseRecordContext(params),relation=context?recordRelation(context.parent,resource.slug):undefined;
  const textSearch=params.get('q')?.trim();const directCode=Boolean(textSearch&&recordPrefixes[resource.slug]&&/^RG-[A-Z]+-[0-9]+$/i.test(textSearch));const salesRPC=!publicOnly&&textSearch&&!directCode?salesSearchRPC[resource.slug]:undefined;if(salesRPC&&textSearch!.length>120)throw new AppError('VALIDATION_ERROR','Search must be at most 120 characters',422);
  let leadFilter;try{if(!publicOnly&&resource.slug==='leads')leadFilter=readLeadFilters(params);}catch{throw new AppError('INVALID_LEAD_FILTER','Choose valid lead filters, status and dates (From must not exceed To).',422);}
  if(directCode&&leadFilter)leadFilter.rpc.search_term=null;
  const useLeadRPC=Boolean(leadFilter&&leadFilterKeys.some(key=>params.get(key)));
  const rpcCustomerContext=Boolean(salesRPC&&context?.parent==='customers'&&relation?.via==='leads');
  let projection=recordFields(resource);
  if(resource.slug==='products'){
    projection+=',product_media(id,alt_text,sort_order,media_assets(public_id,resource_type,visibility))';
  }
  if(context){
    if(publicOnly||!relation)throw new AppError('INVALID_CONTEXT','This record relationship is not supported',422);
    const parent=resourceMap[context.parent];if(!parent)throw new AppError('INVALID_CONTEXT','Unknown parent resource',422);
    const {data:allowed,error:permissionError}=await db.rpc('has_permission',{requested:parent.domain+'.read'});databaseError(permissionError);if(!allowed)throw new AppError('FORBIDDEN','Parent record access is restricted',403);
    const {data:parentRow,error:parentError}=await db.from(parent.table).select('id').eq('id',context.id).maybeSingle();databaseError(parentError);if(!parentRow)throw new AppError('NOT_FOUND','Parent record not found',404);
    if(relation.via&&!rpcCustomerContext)projection+=`,__context_parent:${resourceMap[relation.via]!.table}!inner(${relation.viaColumn})`;
  }
  const sort=readSort(params,[...resource.columns,...(recordPrefixes[resource.slug]?['record_code']:[]),'created_at']);

  let query=(useLeadRPC?db.rpc('filtered_sales_leads',leadFilter!.rpc).select(projection):salesRPC?db.rpc(salesRPC,{search_term:textSearch,...(rpcCustomerContext?{customer_context:context!.id}:{})}).select(projection):db.from(resource.table).select(projection)).order(sort.key,{ascending:sort.ascending,nullsFirst:false}).order('id',{ascending:sort.ascending}).limit(limit+1);
  if(context&&relation&&!rpcCustomerContext)query=relation.column?query.eq(relation.column,context.id):query.eq('__context_parent.'+relation.viaColumn,context.id);
  if(publicOnly){if(resource.slug==='categories')query=query.eq('active',true);else query=query.eq('status','published');}
  if(directCode)query=query.eq('record_code',textSearch!.toUpperCase());
  const q=textSearch;if(q&&!directCode&&!salesRPC&&!useLeadRPC){const searchKey=resource.fields.some(f=>f.key==='name')?'name':resource.fields.some(f=>f.key==='heading')?'heading':resource.slug==='media-assets'?'public_id':resource.slug==='audit-logs'?'entity_type':null;if(!searchKey)throw new AppError('UNSUPPORTED_FILTER','This resource does not support text search',422);const safe=q.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim().slice(0,120);const codeKey=resource.fields.some(f=>f.key==='sku')?'sku':resource.fields.some(f=>f.key==='code')?'code':recordPrefixes[resource.slug]?'record_code':null;query=codeKey&&!publicOnly?query.or(`${searchKey}.ilike.%${safe}%,${codeKey}.ilike.%${safe}%`):query.ilike(searchKey,`%${safe}%`);}
  if(params.get('status')&&!publicOnly)query=query.eq('status',params.get('status'));
  if(params.get('cursor')){if(sort.explicit)query=query.or(sortFilter(params.get('cursor')!,sort));else{const c=parseCursor(params.get('cursor')!);query=query.or(`created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`);}}
  const {data,error}=await query;databaseError(error);const rows=(data??[]) as unknown as Record<string,unknown>[],hasMore=rows.length>limit;const items=rows.slice(0,limit),last=items.at(-1);
  return {items:items.map(row=>{const safe={...row};delete safe.__context_parent;return safe;}),nextCursor:hasMore&&last?(sort.explicit?sortCursor(last,sort):Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url')):null};
}
export async function createRecord(db:SupabaseClient,resource:Resource,input:unknown,idempotencyKey?:string|null){
  if(resource.readOnly)throw new AppError('METHOD_NOT_ALLOWED','Use the workflow action for this resource',405);
  const payload=resourceSchema(resource).parse(input);
  if(['products','product-variants'].includes(resource.slug)&&Number(payload.price_max_minor)<Number(payload.price_min_minor))throw new AppError('VALIDATION_ERROR','Maximum price must cover starting price',422,[{field:'price_max_minor',message:'Maximum price must cover starting price'}]);
  if(resource.slug==='reviews'&&Number(payload.rating)>5)throw new AppError('VALIDATION_ERROR','Rating must be between 1 and 5',422,[{field:'rating',message:'Rating must be between 1 and 5'}]);
  if(resource.rpc){
    if(resource.rpc.startsWith('payment:')||['work-entries','owner-withdrawals','expense-reversals'].includes(resource.slug)){if(!idempotencyKey)throw new AppError('IDEMPOTENCY_REQUIRED','Idempotency-Key header is required',422);payload.idempotency_key=z.uuid().parse(idempotencyKey);}
    const {data,error}=resource.rpc.startsWith('payment:')?await db.rpc('post_payment',{payment_kind:resource.rpc.split(':')[1],payload}):await db.rpc(resource.rpc,{payload});databaseError(error);return {id:data};
  }
  const {data,error}=await db.from(resource.table).insert(payload).select(recordFields(resource)).single();databaseError(error,resource.fields.map(field=>field.key));return data;
}
export async function updateRecord(db:SupabaseClient,resource:Resource,id:string,input:unknown){
  z.uuid().parse(id);if(resource.readOnly||resource.appendOnly||resource.rpc||['measurements','labour-rates'].includes(resource.slug))throw new AppError('METHOD_NOT_ALLOWED','This history is immutable; create a new record',405);
  const payload=resourceSchema(resource,true).parse(input);if(!Object.keys(payload).length)throw new AppError('VALIDATION_ERROR','No changes were submitted',422);
  if(resource.slug==='reviews'&&payload.rating!==undefined&&Number(payload.rating)>5)throw new AppError('VALIDATION_ERROR','Rating must be between 1 and 5',422);
  if(resource.slug==='installations'&&payload.status==='completed'){
    if(payload.customer_confirmed===false){
      throw new AppError('UNPROCESSABLE_ENTITY','Customer installation sign-off is required before completing installation.',422);
    }
    if(payload.customer_confirmed===undefined){
      const {data:cur}=await db.from('installations').select('customer_confirmed').eq('id',id).maybeSingle();
      if(!cur?.customer_confirmed){
        throw new AppError('UNPROCESSABLE_ENTITY','Customer installation sign-off is required before completing installation.',422);
      }
    }
  }
  if(resource.slug==='deliveries'&&payload.status==='delivered'){
    const proof=payload.proof_media_id;
    const confirmed=payload.confirmed_at;
    if(proof===null||confirmed===null){
      throw new AppError('UNPROCESSABLE_ENTITY','Customer delivery sign-off is required before completing delivery.',422);
    }
    if(!proof||!confirmed){
      const {data:cur}=await db.from('deliveries').select('proof_media_id,confirmed_at').eq('id',id).maybeSingle();
      if(!(proof??cur?.proof_media_id)||!(confirmed??cur?.confirmed_at)){
        throw new AppError('UNPROCESSABLE_ENTITY','Customer delivery sign-off is required before completing delivery.',422);
      }
    }
  }
  if(['products','product-variants'].includes(resource.slug)&&(payload.price_min_minor!==undefined||payload.price_max_minor!==undefined)){
    const {data:current,error:readError}=await db.from(resource.table).select('price_min_minor,price_max_minor').eq('id',id).maybeSingle();databaseError(readError);if(!current)throw new AppError('NOT_FOUND','Record not found',404);
    if(Number(payload.price_max_minor??current.price_max_minor)<Number(payload.price_min_minor??current.price_min_minor))throw new AppError('VALIDATION_ERROR','Maximum price must cover starting price',422);
  }
  const {data,error}=await db.from(resource.table).update(payload).eq('id',id).select(recordFields(resource)).maybeSingle();databaseError(error,resource.fields.map(field=>field.key));if(!data)throw new AppError('NOT_FOUND','Record not found',404);return data;
}





