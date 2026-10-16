import { describe,it,expect } from 'vitest';
import { quotationTotals,quoteRevisionSchema } from '@/contracts/quotation';
describe('Quotation amount breakdown',()=>{
 it('applies discount before tax using integer minor units',()=>expect(quotationTotals({items:[{description:'Gate',quantity:2,unit_minor:10000}],discount_minor:1000,tax_bps:1800})).toEqual({subtotal_minor:20000,discount_minor:1000,tax_minor:3420,total_minor:22420}));
 it('rounds each fractional quantity line before summing, as PostgreSQL does',()=>expect(quotationTotals({items:[{description:'A',quantity:1.005,unit_minor:100},{description:'B',quantity:1.005,unit_minor:100}]}).subtotal_minor).toBe(202));
 it('rejects discounts above subtotal and invalid revision fields',()=>{expect(()=>quotationTotals({items:[{description:'Gate',quantity:1,unit_minor:100}],discount_minor:101})).toThrow();expect(()=>quoteRevisionSchema.parse({expires_at:'bad',reason:'x'})).toThrow();});
});
