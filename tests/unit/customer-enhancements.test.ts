import { expect,it,vi,afterEach } from 'vitest';
import { catalogFilters } from '@/features/catalog/filters';
import { designEnquiryUrl } from '@/features/catalog/design-enquiry';
import { measurementRequestSchema,measurementRequirement } from '@/contracts/measurement-request';
import { leadSchema } from '@/contracts/resources';
afterEach(()=>vi.useRealTimers());
it('bounds and sanitizes catalog filters without inventing price options',()=>{
 expect(catalogFilters({material:'Steel,%()._',budget:'50000',sort:'price-low'})).toEqual({material:'Steel',budget:'50000',sort:'price-low'});
 expect(catalogFilters({budget:'-1',sort:'drop-table'})).toEqual({material:'',budget:'',sort:'recent'});
 expect(catalogFilters({budget:'9999999999'}).budget).toBe('');
});
it('WhatsApp drafts contain the selected design link and never invent workshop contacts',()=>{
 const product={name:'Gate & rail',slug:'steel-gate',design_code:'SG-1'};
 expect(designEnquiryUrl(undefined,'https://example.com',product)).toBeNull();
 expect(designEnquiryUrl('1234567890','https://example.com',product)).toBeNull();
 const link=new URL(designEnquiryUrl('9876543210','https://example.com',product)!);
 expect(link.pathname).toBe('/919876543210');expect(link.searchParams.get('text')).toContain('Gate & rail (SG-1)');expect(link.searchParams.get('text')).toContain('https://example.com/catalog/steel-gate');
});
it('measurement preferences use India time and reject past dates/invalid PINs',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-25T20:00:00Z'));
 const input={preferred_date:'2026-10-26',time_window:'morning',address:'Test site address, Jhansi',postal_code:'284001'};
 expect(measurementRequestSchema.safeParse(input).success).toBe(true);
 expect(measurementRequestSchema.safeParse({...input,preferred_date:'2026-10-25'}).success).toBe(false);
 expect(measurementRequestSchema.safeParse({...input,postal_code:'000000'}).success).toBe(false);
 const request=measurementRequestSchema.parse(input);
 const requirement=measurementRequirement('Need a steel gate',request);
 expect(requirement).toContain('not a confirmed appointment');expect(requirement).toContain('284001');expect(requirement).toContain('Asia/Kolkata');
 const lead={name:'Test customer',phone:'9876543210',city:'Jhansi',requirement:'Need a steel gate',measurement_request:input};
 expect(leadSchema.safeParse(lead).success).toBe(true);
 expect(leadSchema.safeParse({...lead,requirement:'x'.repeat(1900)}).success).toBe(false);
});
