import { z } from 'zod';
import { quoteVersionSchema,roundedQuoteLine } from './workflows';

export type QuoteInput=z.input<typeof quoteVersionSchema>;
export type QuoteSnapshot=z.output<typeof quoteVersionSchema>&{subtotal_minor:number;total_minor:number};
export type QuoteVersion={id:string;version:number;created_at:string;snapshot:QuoteSnapshot;total_minor:number;currency:string};
export const quoteRevisionSchema=z.object({expires_at:z.iso.datetime({offset:true}),reason:z.string().trim().min(3).max(500)}).strict();

export function quotationTotals(input:QuoteInput){
 const p=quoteVersionSchema.parse({items:input.items,discount_minor:input.discount_minor,tax_bps:input.tax_bps});
 const subtotal=p.items.reduce((sum,item)=>sum+roundedQuoteLine(item.quantity,item.unit_minor),0);
 const taxable=subtotal-p.discount_minor;
 const tax=Number((BigInt(taxable)*BigInt(p.tax_bps)+BigInt(5000))/BigInt(10000));
 return {subtotal_minor:subtotal,discount_minor:p.discount_minor,tax_minor:tax,total_minor:taxable+tax};
}
