import {describe,it,expect} from 'vitest';
import {readLeadFilters,leadFilterParams} from '@/contracts/lead-filters';
const read=(query:string,now='2026-10-29T18:30:00Z')=>readLeadFilters(new URLSearchParams(query),new Date(now));
describe('lead filters in India time',()=>{
 it('today rolls over at India midnight, using an exclusive next midnight',()=>{expect(read('date=today').rpc).toMatchObject({created_from:'2026-10-29T18:30:00.000Z',created_until:'2026-10-30T18:30:00.000Z'});expect(read('date=today','2026-10-29T18:29:59Z').rpc.created_from).toBe('2026-10-28T18:30:00.000Z');});
 it('yesterday and seven days include the full calendar days',()=>{expect(read('date=yesterday').rpc).toMatchObject({created_from:'2026-10-28T18:30:00.000Z',created_until:'2026-10-29T18:30:00.000Z'});expect(read('date=last7').rpc.created_from).toBe('2026-10-23T18:30:00.000Z');});
 it('handles leap-year calendar months and year boundaries',()=>{expect(read('date=month','2028-02-10T00:00:00Z').rpc).toMatchObject({created_from:'2028-01-31T18:30:00.000Z',created_until:'2028-02-29T18:30:00.000Z'});expect(read('date=yesterday','2027-01-01T01:00:00Z').rpc.created_from).toBe('2026-12-30T18:30:00.000Z');});
 it('custom dates include both selected calendar dates',()=>{expect(read('date=custom&from=2026-10-01&until=2026-10-30').rpc).toMatchObject({created_from:'2026-09-30T18:30:00.000Z',created_until:'2026-10-30T18:30:00.000Z'});});
 it.each(['date=custom','date=custom&from=2026-10-30&until=2026-10-01','date=today&from=2026-10-01','date=custom&from=2026-02-30&until=2026-03-01','source=website','assigned=not-a-uuid','follow_up=completed','status=INVALID'])('rejects invalid combinations: %s',query=>{expect(()=>read(query)).toThrow();});
 it('creation dates stay unrestricted when only filtering follow-ups',()=>{expect(read('follow_up=today&assigned=me&source=whatsapp').rpc).toMatchObject({created_from:null,created_until:null,assignment:'me',lead_source:'whatsapp',followup_filter:'today'});});
 it('serializes only active filters and trims search separately',()=>{expect(leadFilterParams({date:'all',source:'',assigned:'me'}).toString()).toBe('assigned=me');expect(read('q=%20Saloni%20').rpc.search_term).toBe('Saloni');});
});
