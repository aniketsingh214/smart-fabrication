import { apiFormError,FieldValidationError } from '@/lib/form-errors';
import { stockSchema } from '@/contracts/workflows';

export type StockPayload={material_id:string;quantity:number;unit_cost_minor:number;kind:'adjustment'|'consumption'|'return';work_order_id:string|null;note:string};
export class StockPostError extends Error {constructor(message:string,public readonly rejected=false,public readonly details?:unknown){super(message);}}
export type StockStore={read:()=>string|null;write:(value:string|null)=>void};
/** Replay one unresolved command; optional account-scoped tab storage survives navigation. */
export class StockPosting {
 private pending?:{key:string;body:string};
 private running=false;
 recoveryError?:string;
 constructor(private store?:StockStore){
  try{const saved=store?.read();if(saved){const value=JSON.parse(saved);if(typeof value.key!=='string'||typeof value.body!=='string')throw new Error();stockSchema.parse({...JSON.parse(value.body),idempotency_key:value.key});this.pending={key:value.key,body:value.body};}}
  catch{this.recoveryError='The saved stock request cannot be recovered. Check the movement ledger before clearing the saved request.';}
 }
 get unresolved(){return Boolean(this.pending);}
 get payload():StockPayload|undefined{return this.pending?JSON.parse(this.pending.body):undefined;}
 discardAfterReview(){if(this.running)throw new StockPostError('A stock request is already in progress.');this.store?.write(null);this.pending=undefined;this.recoveryError=undefined;}
 async post(payload:StockPayload,send:typeof fetch=fetch){
  if(this.recoveryError)throw new StockPostError(this.recoveryError);
  if(this.running)throw new StockPostError('A stock request is already in progress.');
  if(!this.pending){const key=crypto.randomUUID();stockSchema.parse({...payload,idempotency_key:key});this.pending={key,body:JSON.stringify(payload)};}
  else if(this.pending.body!==JSON.stringify(payload))throw new StockPostError('Retry the pending stock movement before changing its details.');
  this.running=true;
  try{
   // Persist before dispatch. Storage failure must not send an unrecorded command.
   this.store?.write(JSON.stringify(this.pending));
   const response=await send('/api/v1/inventory/adjustments',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':this.pending.key},body:this.pending.body});
   const result=await response.json();
   if(!response.ok){
    const rejected=response.status>=400&&response.status<500&&['VALIDATION_ERROR','FORBIDDEN','UNAUTHENTICATED','CONFLICT','NOT_FOUND','IDEMPOTENCY_REQUIRED'].includes(result.error?.code);
    if(rejected){this.store?.write(null);this.pending=undefined;}
    const fieldError=apiFormError(result.error,'Unable to post stock');throw new StockPostError(fieldError.message,rejected,Object.entries(fieldError.fields).map(([field,message])=>({field,message})));
   }
   if(typeof result.data?.id!=='string')throw new StockPostError('Stock response could not be confirmed. Retry the same movement.');
   this.store?.write(null);this.pending=undefined;return result.data;
  }finally{this.running=false;}
 }
}

export function stockPayload(form:FormData):StockPayload{
 const value=String(form.get('unit_cost')??'');
 if(!/^\d+(\.\d{1,2})?$/.test(value))throw new FieldValidationError({unit_cost:'Enter a unit cost with at most two decimal places.'},'Enter a unit cost with at most two decimal places.');
 const [whole,fraction='']=value.split('.');const minor=BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,'0'));
 if(minor>BigInt(Number.MAX_SAFE_INTEGER))throw new FieldValidationError({unit_cost:'Unit cost is outside the supported range.'},'Unit cost is outside the supported range.');
 return {material_id:String(form.get('material_id')),quantity:Number(form.get('quantity')),unit_cost_minor:Number(minor),kind:String(form.get('kind')) as StockPayload['kind'],work_order_id:String(form.get('work_order_id')??'')||null,note:String(form.get('note')??'')};
}
