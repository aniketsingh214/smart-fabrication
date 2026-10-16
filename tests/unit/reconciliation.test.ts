import { expect,it } from 'vitest';
import { exactRupees,reconciliationSchema } from '@/contracts/reconciliation';
it('formats aggregate minor units beyond floating-point precision without losing paise',()=>{
 expect(exactRupees('9007199254740993')).toBe('₹9,00,71,99,25,47,409.93');
 expect(exactRupees('-1')).toBe('-₹0.01');expect(exactRupees('0')).toBe('₹0.00');
 expect(()=>exactRupees('1.1')).toThrow();
});
it('distinguishes unavailable scope from zero and rejects an official accounting claim',()=>{
 const report={as_of:'2026-10-15T12:00:00Z',currency:'INR',scope:'current_operational_snapshot',official_accounts:false,inventory:null,job_costs:null,purchase_tax:null};
 expect(reconciliationSchema.parse(report).inventory).toBe(null);
 expect(()=>reconciliationSchema.parse({...report,official_accounts:true})).toThrow();
});
