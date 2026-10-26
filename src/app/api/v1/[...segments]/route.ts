import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { measurementRequirement } from '@/contracts/measurement-request';
import { resourceMap,leadSchema } from '@/contracts/resources';
import { failure,success,jsonBody,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { requestContext } from '@/lib/auth/request';
import { serverClient } from '@/lib/supabase/server';
import { createRecord,listRecords,updateRecord,customerOrders,customerQuotations,recordFields } from '@/features/operations/services';
import { runAction } from '@/features/operations/actions';
import { enquiryUploadToken } from '@/lib/cloudinary/guest-token';
import { catalogConfiguration } from '@/features/catalog/configuration';
type Context={params:Promise<{segments:string[]}>};
async function handle(request:NextRequest,context:Context){const requestId=crypto.randomUUID();try{
  const {segments}=await context.params;const admin=segments[0]==='admin';const [slug,id,action]=admin?segments.slice(1):segments;
  if(segments.length>(admin?4:3))throw new AppError('NOT_FOUND','Unknown resource path',404);
  const resource=resourceMap[slug];if(!resource)throw new AppError('NOT_FOUND','Unknown resource',404);
  if(request.method==='GET'&&(request.nextUrl.searchParams.has('context')||request.nextUrl.searchParams.has('context_id'))&&(!admin||id||action))throw new AppError('INVALID_CONTEXT','Context filters are supported only on staff collections',422);
  if(slug==='products'&&action==='preview'&&!admin)throw new AppError('NOT_FOUND','Unknown resource path',404);
  if(!admin&&slug==='leads'&&request.method==='POST'&&!id){const input=leadSchema.parse(await jsonBody(request));input.requirement=measurementRequirement(String(input.requirement),input.measurement_request);delete input.measurement_request;delete input.website;delete input.customer_id;const db=await serverClient();const {data,error}=await db.rpc('submit_lead',{payload:input});if(error?.message==='Enquiry limit reached')throw new AppError('RATE_LIMITED','Please try again later',429);databaseError(error);return success({id:data,uploadToken:enquiryUploadToken(data)},requestId,201);}
  const isPublic=!admin&&resource.public&&request.method==='GET';
  const customerRead=!admin&&['orders','quotations'].includes(slug)&&request.method==='GET';
  const customerAction=!admin&&slug==='quotations'&&['accept','reject'].includes(action??'');
  const actionBody=request.method==='POST'&&id&&action?await jsonBody(request):undefined;
  let permission:string|string[]=request.method==='GET'?`${resource.domain}.read`:action&&['approve','receive'].includes(action)?`${resource.domain}.approve`:resource.writePermission??`${resource.domain}.write`;
  if(slug==='stock-reservations'&&action==='release')permission=['production.write','inventory.approve'];
  if(slug==='quotations'&&action==='convert')permission='orders.write';
  if(slug==='quotations'&&action==='revise')permission='quotations.approve';
  if(slug==='orders'&&action==='transitions'){const status=String((actionBody as {status?:unknown})?.status);permission=['PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY'].includes(status)?'production.write':['OUT_FOR_DELIVERY','INSTALLATION','COMPLETED'].includes(status)?'delivery.write':status==='CANCELLED'?'orders.approve':'orders.write';}
  const db=isPublic?await serverClient():(await requestContext(request,customerRead||customerAction?undefined:permission)).db;
  if(request.method==='GET'){
    if(slug==='suppliers'&&action==='statement'){const raw=request.nextUrl.searchParams.get('cursor');let cursor:{created_at:string;kind:string;id:string}|null=null;if(raw){try{cursor=z.object({created_at:z.iso.datetime({offset:true}),kind:z.enum(['invoice','payment','return','supplier_refund','supplier_payment_reversal']),id:z.uuid()}).strict().parse(JSON.parse(Buffer.from(raw,'base64url').toString('utf8')));}catch{throw new AppError('INVALID_CURSOR','Invalid statement cursor',422);}}const {data,error}=await db.rpc('supplier_statement',{target:z.uuid().parse(id),after_created:cursor?.created_at??null,after_kind:cursor?.kind??null,after_id:cursor?.id??null,page_limit:26});databaseError(error);const entries=(data.entries??[]) as {id:string;kind:string;created_at:string}[],page=entries.slice(0,25),last=page.at(-1);return success({...data,entries:page},requestId,200,{nextCursor:entries.length>25&&last?Buffer.from(JSON.stringify({created_at:last.created_at,kind:last.kind,id:last.id})).toString('base64url'):null});}
    if(slug==='products'&&['preview','configuration'].includes(action??''))return success(await catalogConfiguration(db,id,action==='preview'),requestId);
    if(customerRead&&slug==='orders'){const {data:staff}=await db.rpc('has_permission',{requested:'orders.read'});if(!staff){if(action==='timeline'){const {data,error}=await db.rpc('customer_order_timeline',{target:z.uuid().parse(id)});databaseError(error);return success(data,requestId);}if(action)throw new AppError('NOT_FOUND','Unknown resource path',404);const result=await customerOrders(db,request.nextUrl.searchParams,id);if(id&&!result.items.length)throw new AppError('NOT_FOUND','Order not found',404);return success(id?result.items[0]:result.items,requestId,200,{nextCursor:result.nextCursor});}}
    if(customerRead&&slug==='quotations'&&!action){const {data:staff}=await db.rpc('has_permission',{requested:'quotations.read'});if(!staff){const result=await customerQuotations(db,request.nextUrl.searchParams,id);if(id&&!result.items.length)throw new AppError('NOT_FOUND','Quotation not found',404);return success(id?result.items[0]:result.items,requestId,200,{nextCursor:result.nextCursor});}}
    if(action==='versions'&&slug==='quotations'){const {data,error}=await db.from('quotation_versions').select('id,quotation_id,version,snapshot,total_minor,currency,created_at').eq('quotation_id',z.uuid().parse(id)).order('version',{ascending:false});databaseError(error);return success(data,requestId);}
    if(action==='timeline'&&slug==='orders'){const {data,error}=await db.from('order_status_history').select('*').eq('order_id',z.uuid().parse(id)).order('created_at');databaseError(error);return success(data,requestId);}
    if(action)throw new AppError('NOT_FOUND','Unknown resource path',404);
    if(id){z.uuid().parse(id);let query=db.from(resource.table).select(recordFields(resource)).eq('id',id);if(isPublic)query=slug==='categories'?query.eq('active',true):query.eq('status','published');const {data,error}=await query.maybeSingle();databaseError(error);if(!data)throw new AppError('NOT_FOUND','Record not found',404);return success(data,requestId);}
    const {items,nextCursor}=await listRecords(db,resource,request.nextUrl.searchParams,isPublic);return success(items,requestId,200,{nextCursor});
  }
  if(request.method==='POST'){
    if(id&&action)return success(await runAction(db,slug,id,action,actionBody,request.headers.get('idempotency-key')),requestId);
    if(id)throw new AppError('METHOD_NOT_ALLOWED','Use a documented workflow path',405);
    return success(await createRecord(db,resource,await jsonBody(request),request.headers.get('idempotency-key')),requestId,201);
  }
  if(request.method==='PATCH'&&id&&!action)return success(await updateRecord(db,resource,id,await jsonBody(request)),requestId);
  throw new AppError('METHOD_NOT_ALLOWED','Method not supported',405);
}catch(e){return failure(e,requestId);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;

