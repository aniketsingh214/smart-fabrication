import { z } from 'zod';
export const leadStates=['NEW','CONTACTED','REQUIREMENT_CONFIRMED','MEASUREMENT_PENDING','MEASUREMENT_DONE','QUOTATION_SENT','NEGOTIATION','ORDER_CONFIRMED','PRODUCTION','COMPLETED'] as const;
export const orderStates=['CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING','PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY','OUT_FOR_DELIVERY','INSTALLATION','COMPLETED'] as const;
export function nextStates(status:string,kind:'lead'|'order'){const states:readonly string[]=kind==='lead'?leadStates:orderStates;const i=states.indexOf(status);return [...(i>=0&&i<states.length-1?[states[i+1]]:[]),...(kind==='lead'&&status!=='COMPLETED'?status==='LOST'?['CONTACTED']:['LOST']:[])];}
export const transitionSchema=z.object({status:z.string().min(1).max(40),version:z.number().int().positive(),note:z.string().max(1000).default('')}).strict();
export function roundedQuoteLine(quantity:number,unitMinor:number){
 if(!Number.isFinite(quantity)||quantity<=0||!Number.isSafeInteger(unitMinor)||unitMinor<0)throw new Error('Invalid quotation amount');
 const [decimal,exponent='0']=String(quantity).toLowerCase().split('e'),[whole,fraction='']=decimal.split('.');
 const scale=fraction.length-Number(exponent),coefficient=BigInt(whole+fraction)*BigInt(unitMinor);
 if(scale<=0)return Number(coefficient*BigInt(10)**BigInt(-scale));
 const divisor=BigInt(10)**BigInt(scale);return Number((coefficient+divisor/BigInt(2))/divisor);
}
export const quoteVersionSchema=z.object({items:z.array(z.object({description:z.string().min(1).max(200),quantity:z.number().positive().max(1e6),unit_minor:z.number().int().nonnegative().max(1e12)}).strict()).min(1).max(100),discount_minor:z.number().int().nonnegative().default(0),tax_bps:z.number().int().min(0).max(10000).default(0)}).strict().refine(p=>{const subtotal=p.items.reduce((sum,l)=>sum+roundedQuoteLine(l.quantity,l.unit_minor),0);return subtotal>0&&subtotal<=9e12&&p.discount_minor<=subtotal&&(subtotal-p.discount_minor)*(1+p.tax_bps/10000)<=9e12;},'Quotation discount or total is outside supported range');
export const stockSchema=z.object({material_id:z.uuid(),quantity:z.number().finite().refine(v=>v!==0),unit_cost_minor:z.number().int().nonnegative(),kind:z.enum(['adjustment','consumption','return']),work_order_id:z.uuid().nullable().optional(),note:z.string().min(3).max(500),idempotency_key:z.uuid()}).strict().refine(v=>v.kind!=='consumption'||v.quantity<0&&Boolean(v.work_order_id),'Consumption needs a job and negative quantity');
