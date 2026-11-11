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
  else if(resource==='orders'&&action==='transitions'){
    const p=transitionSchema.parse(body);
    if(p.status==='OUT_FOR_DELIVERY'){
      const {data:bal,error:balErr}=await db.rpc('receivable_balances').eq('order_id',id).maybeSingle();
      const row=bal as {outstanding_minor?:number|string}|null;
      if(!balErr&&row&&Number(row.outstanding_minor)>0){
        throw new AppError('UNPROCESSABLE_ENTITY','100% payment is required before dispatch. Please complete the Next Payment (ALL DONE).',422);
      }
    }
    if(p.status==='COMPLETED'){
      const {data:bal,error:balErr}=await db.rpc('receivable_balances').eq('order_id',id).maybeSingle();
      const row=bal as {outstanding_minor?:number|string}|null;
      if(!balErr&&row&&Number(row.outstanding_minor)>0){
        throw new AppError('UNPROCESSABLE_ENTITY','Order cannot be completed. Please finish all pending workflow stages and obtain the required customer sign-offs.',422);
      }
    }
    result=await db.rpc('transition_order',{target:id,next_status:p.status,expected_version:p.version,note:p.note});
  }
  else if(resource==='quotations'&&action==='versions'){const p=quoteVersionSchema.parse(body);result=await db.rpc('make_quotation_version',{target:id,...p});}
  else if(resource==='quotations'&&action==='revise'){const p=quoteRevisionSchema.parse(body);if(!idempotencyKey)throw new AppError('IDEMPOTENCY_REQUIRED','Idempotency-Key header is required',422);result=await db.rpc('revise_quotation',{target:id,new_expiry:p.expires_at,reason:p.reason,request_key:z.uuid().parse(idempotencyKey)});}
  else if(resource==='quotations'&&action==='approve')result=await db.rpc('approve_quotation',{target:id});
  else if(resource==='quotations'&&['accept','reject'].includes(action))result=await db.rpc('respond_quotation',{target:id,accepted:action==='accept'});
  else if(resource==='quotations'&&action==='convert')result=await db.rpc('convert_quotation',{target:id});
  else if(resource==='purchases'&&action==='receive')result=await db.rpc('receive_purchase',{target:id});
  else if(resource==='stock-reservations'&&action==='release'){const {reason}=z.object({reason:z.string().min(3).max(500)}).strict().parse(body);result=await db.rpc('release_reservation',{target:id,reason});}
  else if(resource==='expenses'&&action==='approve')result=await db.from('expenses').update({status:'approved'}).eq('id',id).eq('status','draft').select('id').single();
  else if(resource==='work-orders'&&action==='transitions'){const p=z.object({status:z.enum(['fabrication','finishing','quality_check','ready'])}).strict().parse(body);result=await db.from('work_orders').update(p).eq('id',id).select().single();}
  else if(resource==='deliveries'&&(action==='transitions'||action==='signoff')){
    const p=z.object({
      status:z.enum(['dispatched','delivered']),
      delivered_by:z.string().trim().max(200).optional(),
      customer_signature:z.string().trim().max(200).optional(),
      remarks:z.string().trim().max(2000).optional(),
      proof_media_id:z.uuid().optional().nullable(),
      confirmed_at:z.iso.datetime({offset:true}).optional()
    }).strict().parse(body);
    if(p.status==='delivered'&&!p.confirmed_at){
      throw new AppError('UNPROCESSABLE_ENTITY','Customer delivery sign-off is required before completing delivery.',422);
    }
    const updatePayload:Record<string,unknown>={status:p.status};
    if(p.confirmed_at)updatePayload.confirmed_at=p.confirmed_at;
    if(p.delivered_by!==undefined)updatePayload.delivered_by=p.delivered_by;
    if(p.customer_signature!==undefined)updatePayload.customer_signature=p.customer_signature;
    if(p.remarks!==undefined)updatePayload.remarks=p.remarks;
    if(p.proof_media_id!==undefined)updatePayload.proof_media_id=p.proof_media_id;
    result=await db.from('deliveries').update(updatePayload).eq('id',id).select().single();
  }
  else if(resource==='installations'&&(action==='transitions'||action==='signoff')){
    const p=z.object({
      status:z.enum(['pending','completed']),
      installed_by:z.string().trim().max(200).optional(),
      customer_signature:z.string().trim().max(200).optional(),
      remarks:z.string().trim().max(2000).optional(),
      customer_confirmed:z.boolean().optional(),
      completed_at:z.iso.datetime({offset:true}).optional(),
      checklist:z.record(z.string(),z.boolean()).optional(),
    }).strict().parse(body);
    const updatePayload:Record<string,unknown>={
      status:p.status,
      customer_confirmed:p.status==='completed'?true:Boolean(p.customer_confirmed),
      checklist:p.checklist??{fixings_checked:true,alignment_checked:true,finish_checked:true,site_cleaned:true},
    };
    if(p.completed_at)updatePayload.completed_at=p.completed_at;
    if(p.installed_by!==undefined)updatePayload.installed_by=p.installed_by;
    if(p.customer_signature!==undefined)updatePayload.customer_signature=p.customer_signature;
    if(p.remarks!==undefined)updatePayload.remarks=p.remarks;
    result=await db.from('installations').update(updatePayload).eq('id',id).select().single();
  }
  else if(resource==='product-media'&&action==='delete')result=await db.rpc('delete_product_media',{target:id});
  else throw new AppError('NOT_FOUND','Unknown workflow action',404);
  databaseError(result.error);return {result:result.data??null};
}
