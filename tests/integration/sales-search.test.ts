import { describe,expect,it,vi } from 'vitest';
import { listRecords } from '@/features/operations/services';
import { resourceMap } from '@/contracts/resources';
import type { SupabaseClient } from '@supabase/supabase-js';

function fixture(rows:Record<string,unknown>[]=[]){
 const query={select:vi.fn(),order:vi.fn(),limit:vi.fn(),eq:vi.fn(),or:vi.fn(),ilike:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:{id:'parent'},error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};
 for(const method of ['select','order','limit','eq','or','ilike'] as const)query[method].mockReturnValue(query);
 const rpc=vi.fn((name:string)=>name==='has_permission'?Promise.resolve({data:true,error:null}):query),from=vi.fn(()=>query);
 return {query,rpc,from,db:{rpc,from} as unknown as SupabaseClient};
}
describe('CRM backend collection search',()=>{
 for(const [slug,rpc] of Object.entries({leads:'search_sales_leads',customers:'search_sales_customers',quotations:'search_sales_quotations','follow-ups':'search_sales_follow_ups',measurements:'search_sales_measurements'})){
  it(`${slug} delegates trimmed search to its RLS RPC`,async()=>{const f=fixture();await listRecords(f.db,resourceMap[slug]!,new URLSearchParams({q:'  Saloni  '}));expect(f.rpc).toHaveBeenCalledWith(rpc,{search_term:'Saloni'});expect(f.from).not.toHaveBeenCalled();expect(f.query.ilike).not.toHaveBeenCalled();});
 }
 it('intersects relational search with exact customer context, status and cursor',async()=>{
  const f=fixture(),id=crypto.randomUUID(),cursor=Buffer.from(JSON.stringify({created_at:'2026-10-29T10:00:00Z',id:crypto.randomUUID()})).toString('base64url');
  await listRecords(f.db,resourceMap['follow-ups']!,new URLSearchParams({q:'Saloni',context:'customers',context_id:id,status:'pending',cursor,limit:'10'}));
  expect(f.rpc).toHaveBeenCalledWith('has_permission',{requested:'customers.read'});
  expect(f.rpc).toHaveBeenCalledWith('search_sales_follow_ups',{search_term:'Saloni',customer_context:id});
  expect(f.query.select).not.toHaveBeenCalledWith(expect.stringContaining('__context_parent:'));
  expect(f.query.eq).not.toHaveBeenCalledWith('__context_parent.customer_id',id);expect(f.query.eq).toHaveBeenCalledWith('status','pending');expect(f.query.or).toHaveBeenCalledWith(expect.stringContaining('created_at.lt.'));expect(f.query.limit).toHaveBeenCalledWith(11);
 });
 it('clear/blank search uses the base collection and normal paging',async()=>{const f=fixture();await listRecords(f.db,resourceMap.leads!,new URLSearchParams({q:'   '}));expect(f.rpc).not.toHaveBeenCalled();expect(f.from).toHaveBeenCalledWith('leads');expect(f.query.ilike).not.toHaveBeenCalled();});
 it('rejects oversized CRM search before issuing the query',async()=>{const f=fixture();await expect(listRecords(f.db,resourceMap.customers!,new URLSearchParams({q:'x'.repeat(121)}))).rejects.toMatchObject({status:422});expect(f.rpc).not.toHaveBeenCalled();});
 it('keeps public product search on its published collection',async()=>{const f=fixture();await listRecords(f.db,resourceMap.products!,new URLSearchParams({q:'gate'}),true);expect(f.rpc).not.toHaveBeenCalled();expect(f.query.eq).toHaveBeenCalledWith('status','published');expect(f.query.ilike).toHaveBeenCalledWith('name','%gate%');});
 it('lead filters combine RPC search with status and pagination before slicing',async()=>{const f=fixture();await listRecords(f.db,resourceMap.leads!,new URLSearchParams({q:'Saloni',date:'today',assigned:'me',source:'whatsapp',follow_up:'overdue',status:'NEW',limit:'10'}));expect(f.rpc).toHaveBeenCalledWith('filtered_sales_leads',expect.objectContaining({search_term:'Saloni',assignment:'me',lead_source:'whatsapp',followup_filter:'overdue',created_from:expect.any(String),created_until:expect.any(String)}));expect(f.query.eq).toHaveBeenCalledWith('status','NEW');expect(f.query.limit).toHaveBeenCalledWith(11);});
 it('invalid lead filters fail before database access',async()=>{const f=fixture();await expect(listRecords(f.db,resourceMap.leads!,new URLSearchParams({date:'custom',from:'2026-10-30',until:'2026-10-01'}))).rejects.toMatchObject({status:422});expect(f.rpc).not.toHaveBeenCalled();expect(f.from).not.toHaveBeenCalled();});
});
