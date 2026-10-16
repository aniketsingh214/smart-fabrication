import { describe,it,expect } from 'vitest';
import { financialCorrectionSchema,periodClosureSchema } from '@/contracts/finance-corrections';
import { resourceSchema,resourceMap } from '@/contracts/resources';
const base={kind:'supplier_refund',source_id:crypto.randomUUID(),posting_date:'2026-10-15',mode:'bank',reference:'refund-1',reason:'Verified supplier repayment',confirmed:true};
describe('Financial correction boundaries',()=>{
 it('requires a positive explicit amount for a verified supplier refund',()=>{expect(financialCorrectionSchema.parse({...base,amount_minor:100}).amount_minor).toBe(100);expect(()=>financialCorrectionSchema.parse(base)).toThrow();expect(()=>financialCorrectionSchema.parse({...base,amount_minor:100,confirmed:false})).toThrow();});
 it('rejects client amount overrides and actor escalation for reversals',()=>{expect(()=>financialCorrectionSchema.parse({...base,kind:'customer_payment_reversal',amount_minor:100})).toThrow();expect(()=>financialCorrectionSchema.parse({...base,kind:'withdrawal_reversal',created_by:crypto.randomUUID()})).toThrow();});
 it('requires an explicit reviewed-period confirmation',()=>{expect(()=>periodClosureSchema.parse({closed_through:'2026-09-30',reason:'Reconciled',confirmed:false})).toThrow();expect(periodClosureSchema.parse({closed_through:'2026-09-30',reason:'Reconciled',confirmed:true}).confirmed).toBe(true);});
 it('defaults purchase lines to zero discount/tax and rejects fractional basis points',()=>{const value={purchase_id:crypto.randomUUID(),material_id:crypto.randomUUID(),quantity:1,rate_minor:100};const parsed=resourceSchema(resourceMap['purchase-items']!).parse(value);expect(parsed.discount_minor).toBe(0);expect(parsed.tax_bps).toBe(0);expect(parsed.tax_recoverable).toBe(false);expect(()=>resourceSchema(resourceMap['purchase-items']!).parse({...value,tax_bps:18.5})).toThrow();});
});
