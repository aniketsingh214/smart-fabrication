import { z } from 'zod';
export type RecordRelation={parent:string;child:string;label:string;column?:string;via?:string;viaColumn?:string;hidden?:boolean};
export const recordRelations:RecordRelation[]=[
 {parent:'customers',child:'leads',label:'Enquiries',column:'customer_id'},
 {parent:'customers',child:'quotations',label:'Quotations',column:'customer_id'},
 {parent:'customers',child:'follow-ups',label:'Follow-ups',via:'leads',viaColumn:'customer_id'},
 {parent:'customers',child:'measurements',label:'Measurements',via:'leads',viaColumn:'customer_id'},
 {parent:'leads',child:'lead-notes',label:'Notes',column:'lead_id'},
 {parent:'leads',child:'follow-ups',label:'Follow-ups',column:'lead_id'},
 {parent:'leads',child:'measurements',label:'Measurements',column:'lead_id'},
 {parent:'leads',child:'quotations',label:'Quotations',column:'lead_id'},
 {parent:'products',child:'product-media',label:'Images',column:'product_id'},
 {parent:'products',child:'product-variants',label:'Variants',column:'product_id'},
 {parent:'products',child:'product-options',label:'Options',column:'product_id'},
 {parent:'products',child:'bom-versions',label:'BOM',column:'product_id'},
 {parent:'products',child:'calculation-rules',label:'Pricing',column:'product_id'},
 {parent:'orders',child:'work-orders',label:'Production',column:'order_id'},
 {parent:'orders',child:'customer-payments',label:'Payments',column:'order_id'},
 {parent:'orders',child:'quality-checks',label:'Quality',via:'work-orders',viaColumn:'order_id',hidden:true},
 {parent:'orders',child:'deliveries',label:'Delivery',column:'order_id'},
 {parent:'orders',child:'installations',label:'Installation',via:'deliveries',viaColumn:'order_id'},
 {parent:'purchases',child:'purchase-items',label:'Items',column:'purchase_id'},
 {parent:'purchases',child:'supplier-payments',label:'Payments',column:'purchase_id'},
 {parent:'purchases',child:'purchase-returns',label:'Returns',via:'purchase-items',viaColumn:'purchase_id'},
 {parent:'workers',child:'labour-rates',label:'Rates',column:'worker_id'},
 {parent:'workers',child:'work-entries',label:'Work entries',column:'worker_id'},
 {parent:'workers',child:'labour-payments',label:'Payments',column:'worker_id'},
 {parent:'bom-versions',child:'bom-items',label:'Materials',column:'bom_id'},
];
export type RecordContext={parent:string;id:string;name?:string;defaults?:Record<string,string>};
export function recordRelation(parent:string,child:string){return recordRelations.find(relation=>relation.parent===parent&&relation.child===child);}
export function parseRecordContext(params:URLSearchParams){
 if(!params.has('context')&&!params.has('context_id'))return null;
 return z.object({parent:z.string().min(1).max(60),id:z.uuid()}).parse({parent:params.get('context'),id:params.get('context_id')});
}
