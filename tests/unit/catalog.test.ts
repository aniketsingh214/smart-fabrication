import { expect,it } from 'vitest';
import { duplicateProductSchema } from '@/contracts/catalog';
import { resourceMap,resourceSchema,leadSchema } from '@/contracts/resources';
it('requires a fresh valid SKU/slug and rejects publication escalation in a copy request',()=>{
 expect(duplicateProductSchema.parse({name:'New gate',sku:'GATE-2',slug:'new-gate'}).slug).toBe('new-gate');
 expect(()=>duplicateProductSchema.parse({name:'New gate',sku:'GATE-2',slug:'Bad Slug'})).toThrow();
 expect(()=>duplicateProductSchema.parse({name:'New gate',sku:'GATE-2',slug:'new-gate',status:'published'})).toThrow();
});
it('validates variant price boundaries and keeps options behind protected resource endpoints',()=>{
 expect(resourceMap['product-options']!.public).not.toBe(true);
 expect(()=>resourceSchema(resourceMap['product-variants']!).parse({product_id:crypto.randomUUID(),name:'Variant',sku:'V-1',price_min_minor:-1,price_max_minor:0})).toThrow();
});
it('expense reversal input cannot set a different amount or actor',()=>expect(()=>resourceSchema(resourceMap['expense-reversals']!).parse({expense_id:crypto.randomUUID(),reversal_date:'2026-10-15',reason:'Correction',amount_minor:100,created_by:crypto.randomUUID()})).toThrow());
it('rejects duplicated/oversized choice lists and client-provided configuration snapshots',()=>{
 const base={name:'Visitor',phone:'919876543210',city:'Delhi',requirement:'A custom fabricated gate',product_id:crypto.randomUUID()},id=crypto.randomUUID();
 expect(leadSchema.parse({...base,selected_option_ids:[id]}).selected_option_ids).toEqual([id]);
 expect(()=>leadSchema.parse({...base,selected_option_ids:[id,id]})).toThrow();
 expect(()=>leadSchema.parse({...base,selected_option_ids:Array.from({length:21},()=>crypto.randomUUID())})).toThrow();
 expect(()=>leadSchema.parse({...base,configuration_snapshot:{price_minor:1}})).toThrow();
});
it('limits catalog weight and rejects non-positive measurements',()=>{
 const schema=resourceSchema(resourceMap.products!,true);
 expect(schema.parse({weight_kg:12.125,design_code:'GATE-01'}).weight_kg).toBe(12.125);
 expect(()=>schema.parse({weight_kg:0})).toThrow();expect(()=>schema.parse({weight_kg:10000001})).toThrow();
});
