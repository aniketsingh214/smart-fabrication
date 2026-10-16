import { expect,it } from 'vitest';
import { quotationPdf } from '@/features/quotations/document';
it('renders a real quotation PDF from a fractional-quantity snapshot with discount and tax',async()=>{
 const buffer=await quotationPdf({name:'Site gate quotation',status:'approved',expires_at:'2030-10-20T00:00:00Z'},{version:2,total_minor:119,snapshot:{items:[{description:'Fractional material',quantity:1.005,unit_minor:100}],subtotal_minor:101,discount_minor:0,tax_bps:1800,total_minor:119}});
 expect(buffer.subarray(0,5).toString()).toBe('%PDF-');expect(buffer.length).toBeGreaterThan(1000);
});
