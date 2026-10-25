import { uploadIntentSchema } from '../src/contracts/media-policy.ts';
import { dashboardSchema } from '../src/contracts/dashboard.ts';
import { identitySchema,profileUpdateSchema,notificationSchema,notificationReadSchema,staffProfileSchema } from '../src/contracts/identity.ts';
import { reconciliationSchema } from '../src/contracts/reconciliation.ts';
import { recordFields } from '../src/contracts/resource-projections.ts';
import { customerQuotationSchema,customerOrderSchema,customerTimelineSchema } from '../src/contracts/customer.ts';
import { resourceReadSchema } from './resource-response-schemas.mjs';
import fs from 'node:fs';
import YAML from 'yaml';
import { z } from 'zod';
import { resources,resourceSchema,leadSchema } from '../src/contracts/resources.ts';
import { estimateSchema,estimateResultSchema,estimatePreviewSchema,estimatePreviewResultSchema } from '../src/contracts/estimates.ts';
import { quoteVersionSchema,transitionSchema,stockSchema } from '../src/contracts/workflows.ts';
import { duplicateProductSchema } from '../src/contracts/catalog.ts';
import { financialCorrectionSchema,periodClosureSchema } from '../src/contracts/finance-corrections.ts';
const error={type:'object',required:['error','requestId'],properties:{error:{type:'object',required:['code','message'],properties:{code:{type:'string'},message:{type:'string'},details:{}}},requestId:{type:'string',format:'uuid'}}};
const envelope={type:'object',required:['data','meta','requestId'],properties:{data:{},meta:{type:'object',properties:{nextCursor:{type:['string','null']}}},requestId:{type:'string',format:'uuid'}}};
const auth=[{bearerAuth:[]},{cookieAuth:[]}];
const params=[{name:'id',in:'path',required:true,schema:{type:'string',format:'uuid'}}];
const listing=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:25}},{name:'cursor',in:'query',schema:{type:'string'}},{name:'q',in:'query',description:'Text search on resources with a name/heading field',schema:{type:'string',maxLength:120}},{name:'status',in:'query',schema:{type:'string'}}];
const responses=Object.fromEntries([400,401,403,404,409,413,415,422,429,500,503].map(n=>[n,{description:`HTTP ${n}; sanitized error envelope`,content:{'application/json':{schema:{$ref:'#/components/schemas/Error'}}}}]));
const paths:Record<string,unknown>={};const schemas:Record<string,unknown>={Error:error,Envelope:envelope};
function op(summary:string,permission?:string,body?:unknown,isPublic=false,status=200,extra:Record<string,unknown>={}){return {summary,security:isPublic?[]:auth,'x-permission':permission??'authenticated actor with object ownership',...(body?{requestBody:{required:true,content:{'application/json':{schema:body}}}}:{}),responses:{[status]:{description:'Success envelope',content:{'application/json':{schema:{$ref:'#/components/schemas/Envelope'}}}},...responses},...extra};}
for(const r of resources){
 const name=r.slug.replaceAll('-','_');schemas[`${name}_create`]=z.toJSONSchema(resourceSchema(r));schemas[`${name}_update`]=z.toJSONSchema(resourceSchema(r,true));
 for(const admin of [true,false]){const base=`/${admin?'admin/':''}${r.slug}`;const isPublic=!admin&&r.public===true;const rootCustomer=!admin&&['quotations','orders'].includes(r.slug);const entry:Record<string,unknown>={get:op(`List ${r.title}`,rootCustomer?undefined:`${r.domain}.read`,undefined,isPublic,200,{parameters:listing})};
  if(!r.readOnly)entry.post=op(!admin&&r.slug==='leads'?'Submit guest enquiry':`Create ${r.title}`,r.writePermission??`${r.domain}.write`,{$ref:`#/components/schemas/${name}_create`},!admin&&r.slug==='leads',201,{...(r.rpc?.startsWith('payment:')||['work-entries','owner-withdrawals','expense-reversals'].includes(r.slug)?{parameters:[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',format:'uuid'}}]}:{})});
  paths[base]=entry;const detail:Record<string,unknown>={get:op(`Read ${r.title} record`,rootCustomer?undefined:`${r.domain}.read`,undefined,isPublic,200,{parameters:params})};if(!r.readOnly&&!r.appendOnly&&!r.rpc&&!['measurements','labour-rates'].includes(r.slug))detail.patch=op(`Update ${r.title} record`,`${r.domain}.write`,{$ref:`#/components/schemas/${name}_update`},false,200,{parameters:params});paths[`${base}/{id}`]=detail;
 }
 if(r.actions)for(const base of [`/${r.slug}`,`/admin/${r.slug}`]){
  const actions:Record<string,[string,unknown,string]>={
   'lead-transition':['transitions',z.toJSONSchema(transitionSchema),'leads.write'],
   'order-transition':['transitions',z.toJSONSchema(transitionSchema),'stage-specific orders/production/delivery write'],
   'quote-version':['versions',z.toJSONSchema(quoteVersionSchema),'quotations.write'],
   'quote-approve':['approve',{type:'object',additionalProperties:false},'quotations.approve'],
   'quote-accept':['accept',{type:'object',additionalProperties:false},'customer ownership or quotations.approve'],
   'quote-reject':['reject',{type:'object',additionalProperties:false},'customer ownership or quotations.approve'],
   'quote-convert':['convert',{type:'object',additionalProperties:false},'orders.write; idempotent quotation conversion'],
   'purchase-receive':['receive',{type:'object',additionalProperties:false},'purchases.approve'],
   'expense-approve':['approve',{type:'object',additionalProperties:false},'finance.approve'],
   'production-transition':['transitions',{type:'object',required:['status'],properties:{status:{type:'string',enum:['fabrication','finishing','quality_check','ready']}}},'production.write'],
   'delivery-transition':['transitions',{type:'object',required:['status'],properties:{status:{type:'string',enum:['dispatched','delivered']},proof_media_id:{type:'string',format:'uuid'},confirmed_at:{type:'string',format:'date-time'}}},'delivery.write']
  };
  for(const action of r.actions){const a=actions[action];if(a)paths[`${base}/{id}/${a[0]}`]={post:op(action,a[2],a[1],false,200,{parameters:params})};}
 }
 paths[`/reports/${r.slug}/export`]={get:{...op(`Export ${r.title} in cursor-paged CSV batches (maximum 500 rows per response)`,`${r.domain}.export`,undefined,false,200,{parameters:[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:500,default:500}},{name:'cursor',in:'query',schema:{type:'string'}},{name:'from',in:'query',schema:{type:'string',format:'date'}},{name:'until',in:'query',schema:{type:'string',format:'date'}},{name:'q',in:'query',schema:{type:'string'}},{name:'status',in:'query',schema:{type:'string'}}]}),responses:{200:{description:'CSV with spreadsheet formula injection protection. Follow X-Next-Cursor or Link rel=next; absent cursor means the final batch.',headers:{'X-Next-Cursor':{schema:{type:'string'}},'X-Export-Row-Count':{schema:{type:'integer'}}},content:{'text/csv':{schema:{type:'string'}}}},...responses}}};
}
paths['/finance/adjustments']={post:op('Record reviewed payment/work/withdrawal reversal, supplier refund receipt, or full pre-production customer cancellation refund; no bank transfer is initiated','finance.approve; customer_refund additionally orders.approve',z.toJSONSchema(financialCorrectionSchema),false,201,{parameters:[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',format:'uuid'}}]})};
paths['/finance/periods/close']={post:op('Close a reviewed past finance period; monotonic cutoff and no reopening','finance.approve',z.toJSONSchema(periodClosureSchema),false,201,{parameters:[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',format:'uuid'}}]})};
paths['/health']={get:op('Sanitized health status',undefined,undefined,true)};
paths['/reports/trends']={get:op('Date-filtered RLS-scoped lead source/product and monthly order/purchase/net-cash aggregates; inaccessible domains are null','reports.read',undefined,false,200,{parameters:['from','until'].map(name=>({name,in:'query',schema:{type:'string',format:'date'}}))})};
paths['/me']={get:op('Current profile, safe customer DTO and effective permissions'),patch:op('Update own display name without privilege changes',undefined,{type:'object',required:['display_name'],additionalProperties:false,properties:{display_name:{type:'string',minLength:2,maxLength:120}}})};
paths['/estimates']={post:op('Approximate server-authoritative configured estimate',undefined,z.toJSONSchema(estimateSchema),true,201)};
paths['/inventory/balances']={get:op('Ledger-reconciled inventory balances','inventory.read')};
const stockBody=z.toJSONSchema(stockSchema);if(stockBody.properties)delete stockBody.properties.idempotency_key;stockBody.required=stockBody.required?.filter(key=>key!=='idempotency_key');paths['/inventory/adjustments']={post:op('Post reviewed stock movement; consumption cost is derived from the ledger','inventory.approve or production.write',stockBody,false,201,{parameters:[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',format:'uuid'}}]})};
paths['/quotations/{id}/pdf']={get:{...op('Immutable selected or latest quotation PDF','quotation read permission or customer ownership',undefined,false,200,{parameters:[...params,{name:'version',in:'query',required:false,description:'Exact historical version; omitted means latest visible version',schema:{type:'integer',minimum:1,maximum:2147483647}}]}),responses:{200:{description:'Quotation PDF',content:{'application/pdf':{schema:{type:'string',format:'binary'}}}},...responses}}};
paths['/quotations/{id}/versions']={...paths['/quotations/{id}/versions'] as object,get:op('List quotation version snapshots','quotation read permission or customer ownership',undefined,false,200,{parameters:params})};
paths['/orders/{id}/timeline']={get:op('Order status history','order read permission or customer ownership',undefined,false,200,{parameters:params})};
paths['/reports/profit-loss']={get:op('Provisional finance period totals; accountant approval pending','finance.read',undefined,false,200,{parameters:['start','end'].map(name=>({name,in:'query',schema:{type:'string',format:'date-time'}}))})};
paths['/notifications']={get:op('Own notifications',undefined,undefined,false,200,{parameters:listing.slice(0,2)})};paths['/notifications/{id}/read']={post:op('Mark own notification read',undefined,undefined,false,200,{parameters:params})};
paths['/admin/users']={get:op('List profiles and assigned roles','users.read',undefined,false,200,{parameters:[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:100}},listing[1]]})};
paths['/admin/users/{id}/roles']={post:op('Assign or revoke approved role','users.write',{type:'object',required:['role','enabled'],properties:{role:{type:'string',enum:['owner','sales','production','accounts','content','customer']},enabled:{type:'boolean'}}},false,200,{parameters:params})};
paths['/uploads/sign']={post:op('Sign authenticated Cloudinary upload; private invoice PDF only','context-specific upload permission',z.toJSONSchema(uploadIntentSchema))};












// Specialized endpoint declarations are maintained separately from registry-derived resources.
Object.assign(paths,JSON.parse(fs.readFileSync('scripts/api-specialized-paths.json','utf8')));
const ownedMediaSchema=z.object({id:z.uuid(),public_id:z.string(),context:z.string(),visibility:z.enum(['public','private']),resource_type:z.string(),format:z.string(),created_at:z.iso.datetime({offset:true})});
(paths['/uploads/mine'] as {get:{parameters:unknown[];responses:Record<string,unknown>}}).get.parameters=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:100}},listing[1]];
(paths['/uploads/mine'] as {get:{responses:Record<string,unknown>}}).get.responses[200]={description:'Own verified asset metadata only; stable created_at/id continuation in meta.nextCursor',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:z.toJSONSchema(z.array(ownedMediaSchema))}}}}};
schemas.EstimateResult=z.toJSONSchema(estimateResultSchema);
(paths['/estimates'] as {post:{responses:Record<string,unknown>}}).post.responses[201]={description:'Server-authoritative approximate result with immutable formula/BOM/rate provenance',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:{$ref:'#/components/schemas/EstimateResult'}}}}}};
paths['/estimates/preview']={post:op('Evaluate selected draft/published configuration without saving an estimate','materials.read AND catalog.read',z.toJSONSchema(estimatePreviewSchema),false,200,{responses:{200:{description:'Preview-only result; no issued history ID',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:z.toJSONSchema(estimatePreviewResultSchema)}}}}},...responses}})};
const databaseMetadata=JSON.parse(fs.readFileSync('docs/database/actual-schema.json','utf8'));
for(const resource of resources){
 const name=resource.slug.replaceAll('-','_');schemas[`${name}_record`]=resourceReadSchema(resource,recordFields(resource),databaseMetadata.columns);
 for(const prefix of ['', '/admin'])for(const detail of [false,true]){
  const route=`${prefix}/${resource.slug}${detail?'/{id}':''}`,entry=paths[route] as {get?:{responses:Record<string,unknown>}}|undefined;
  if(!entry?.get)continue;const item={$ref:`#/components/schemas/${name}_record`},data=detail?item:{type:'array',items:item};
  entry.get.responses[200]={description:'Explicit projected resource DTO; collection continuation is in meta.nextCursor',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data}}}}};
 }
}
schemas.guest_enquiry_create=z.toJSONSchema(leadSchema);
(paths['/leads'] as {post:unknown}).post=op('Submit guest enquiry',undefined,{$ref:'#/components/schemas/guest_enquiry_create'},true,201);
schemas.CustomerQuotation=z.toJSONSchema(customerQuotationSchema);schemas.CustomerOrder=z.toJSONSchema(customerOrderSchema);schemas.CustomerTimelineEvent=z.toJSONSchema(customerTimelineSchema);
for(const [slug,dto] of [['quotations','CustomerQuotation'],['orders','CustomerOrder']] as const){
 for(const detail of [false,true]){const record={$ref:`#/components/schemas/${slug}_record`},customer={$ref:`#/components/schemas/${dto}`},data={oneOf:detail?[customer,record]:[{type:'array',items:customer},{type:'array',items:record}]};
  (paths[`/${slug}${detail?'/{id}':''}`] as {get:{responses:Record<string,unknown>}}).get.responses[200]={description:'Owned customer DTO or full projected staff record; arrays use meta.nextCursor',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data}}}}};
 }
}
for(const [route,method,dto] of [['/admin/users','get',z.array(staffProfileSchema)],['/me','get',identitySchema],['/me','patch',profileUpdateSchema],['/notifications','get',z.array(notificationSchema)],['/notifications/{id}/read','post',notificationReadSchema]] as const){
 (paths[route] as Record<string,{responses:Record<string,unknown>}>)[method].responses[200]={description:'Explicit safe identity/notification DTO; arrays use meta.nextCursor',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:z.toJSONSchema(dto)}}}}};
}
paths['/finance/reconciliation']={get:op('Current scoped inventory/job-cost/purchase-tax reconciliation','finance.read',undefined,false,200,{responses:{200:{description:'Exact minor-unit strings; unavailable scopes are null',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:z.toJSONSchema(reconciliationSchema)}}}}},...responses}})};
for(const route of ['/admin/products/{id}/duplicate','/products/{id}/duplicate']){const entry=paths[route] as {post?:Record<string,unknown>}|undefined;if(entry?.post)entry.post.requestBody={required:true,content:{'application/json':{schema:z.toJSONSchema(duplicateProductSchema)}}};}
paths['/dashboard']={get:op('Permission/RLS-scoped daily tasks and order progress; recognized demo markers excluded by default','any operational read permission',undefined,false,200,{parameters:[{name:'scope',in:'query',schema:{type:'string',enum:['business','demo','all'],default:'business'}},{name:'task',in:'query',schema:{type:'string',enum:['all','new','followup','approval','delivery'],default:'all'}},{name:'page',in:'query',schema:{type:'integer',minimum:1,maximum:10000,default:1}}],responses:{200:{description:'Narrow dashboard DTO; inaccessible metrics null; tasks paged ten per page',content:{'application/json':{schema:{...envelope,properties:{...envelope.properties,data:z.toJSONSchema(dashboardSchema)}}}}},...responses}})};
const spec={openapi:'3.1.0',info:{title:'SmartFabrication API',version:'0.1.0',description:'Implemented local API contracts. Supabase RLS and server permission checks apply; cookie writes require same-origin requests. Full production acceptance remains pending.'},servers:[{url:'http://localhost:3000/api/v1',description:'Local development'}],paths,components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'},cookieAuth:{type:'apiKey',in:'cookie',name:'supabase-auth-session',description:'Supabase SSR cookies; browser writes require same-origin Origin.'}},schemas}};
fs.writeFileSync('docs/api/openapi.yaml',YAML.stringify(spec));console.log(`Generated ${Object.keys(paths).length} OpenAPI paths.`);
