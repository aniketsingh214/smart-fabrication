import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { quoteVersionSchema,transitionSchema } from '@/contracts/workflows';
import { quoteRevisionSchema } from '@/contracts/quotation';
import { duplicateProductSchema } from '@/contracts/catalog';
export async function runAction(db:SupabaseClient,resource:string,id:string,action:string,body:unknown,idempotencyKey?:string|null){
  z.uuid().parse(id);
  let result;
  if(resource==='products'&&action==='duplicate'){const p=duplicateProductSchema.parse(body);if(!idempotencyKey)throw new AppError('IDEMPOTENCY_REQUIRED','Idempotency-Key header is required',422);result=await db.rpc('duplicate_product',{target:id,payload:p,request_key:z.uuid().parse(idempotencyKey)});}
  else if(resource==='leads'&&action==='transitions'){const p=transitionSchema.parse(body);result=await db.rpc('transition_lead',{target:id,next_status:p.status,expected_version:p.version});}
  else if(resource==='orders'&&action==='transitions'){const p=transitionSchema.parse(body);result=await db.rpc('transition_order',{target:id,next_status:p.status,expected_version:p.version,note:p.note});}
  else if(resource==='quotations'&&action==='versions'){const p=quoteVersionSchema.parse(body);result=await db.rpc('make_quotation_version',{target:id,...p});}
  else if(resource==='quotations'&&action==='revise'){const p=quoteRevisionSchema.parse(body);if(!idempotencyKey)throw new AppError('IDEMPOTENCY_REQUIRED','Idempotency-Key header is required',422);result=await db.rpc('revise_quotation',{target:id,new_expiry:p.expires_at,reason:p.reason,request_key:z.uuid().parse(idempotencyKey)});}
  else if(resource==='quotations'&&action==='approve')result=await db.rpc('approve_quotation',{target:id});
  else if(resource==='quotations'&&['accept','reject'].includes(action))result=await db.rpc('respond_quotation',{target:id,accepted:action==='accept'});
  else if(resource==='quotations'&&action==='convert')result=await db.rpc('convert_quotation',{target:id});
  else if(resource==='purchases'&&action==='receive')result=await db.rpc('receive_purchase',{target:id});
  else if(resource==='stock-reservations'&&action==='release'){const {reason}=z.object({reason:z.string().min(3).max(500)}).strict().parse(body);result=await db.rpc('release_reservation',{target:id,reason});}
  else if(resource==='expenses'&&action==='approve')result=await db.from('expenses').update({status:'approved'}).eq('id',id).eq('status','draft').select('id').single();
  else if(resource==='work-orders'&&action==='transitions'){const p=z.object({status:z.enum(['fabrication','finishing','quality_check','ready'])}).strict().parse(body);result=await db.from('work_orders').update(p).eq('id',id).select().single();}
  else if(resource==='deliveries'&&action==='transitions'){const p=z.object({status:z.enum(['dispatched','delivered']),proof_media_id:z.uuid().optional(),confirmed_at:z.iso.datetime({offset:true}).optional()}).strict().parse(body);result=await db.from('deliveries').update(p).eq('id',id).select().single();}
  else throw new AppError('NOT_FOUND','Unknown workflow action',404);
  databaseError(result.error);return {result:result.data??null};
}
