import { expect,it,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AccountProjects } from '@/features/account/account-projects';
vi.mock('@/features/quotations/quote-response',()=>({QuoteResponse:()=>null}));
it('shows expired quotation guidance and labels summary counts as page-scoped',async()=>{
 const rpc=vi.fn(async(name:string)=>({data:name==='my_quotation_page'?[{id:crypto.randomUUID(),name:'Old owned quote',status:'approved',expires_at:'2000-01-01T00:00:00Z',created_at:'2000-01-01T00:00:00Z'}]:[],error:null}));
 const html=renderToStaticMarkup(await AccountProjects({db:{rpc} as unknown as SupabaseClient,filters:{}}));
 expect(html).toContain('This quotation has expired');expect(html).toContain('currently displayed pages');expect(html).toContain('not outstanding payment balances');expect(html).toContain('/contact?measurement=1');
});
function fixture(){const records=Array.from({length:26},(_,index)=>({id:crypto.randomUUID(),name:`Owned project ${index}`,status:'approved',expires_at:'2099-10-15T12:00:00Z',total_minor:100,created_at:'2026-10-15T12:00:00Z'}));const rpc=vi.fn(async (_name:string,args:{target?:string})=>({data:args.target?[records[0]]:records,error:null}));return {rpc,db:{rpc} as unknown as SupabaseClient};}
it('renders explicit continuation links for both customer collections',async()=>{const {db}=fixture();const html=renderToStaticMarkup(await AccountProjects({db,filters:{}}));expect(html).toContain('Older quotations');expect(html).toContain('Older orders');expect(html).toContain('/account?qcursor=');expect(html).toContain('/account?ocursor=');});
it('keeps order access usable when a quotation cursor is malformed',async()=>{const {db}=fixture();const html=renderToStaticMarkup(await AccountProjects({db,filters:{qcursor:'invalid'}}));expect(html).toContain('Quotations could not be loaded');expect(html).toContain('First quotation page');expect(html).toContain('Older orders');});
it('opens a specific owned quotation independently of an unrelated page cursor',async()=>{const {db,rpc}=fixture(),id=crypto.randomUUID();const html=renderToStaticMarkup(await AccountProjects({db,filters:{quotation:id,qcursor:'unrelated-old-cursor'}}));expect(rpc).toHaveBeenCalledWith('my_quotation_page',expect.objectContaining({target:id,after_created:null,after_id:null}));expect(html).not.toContain('Older quotations');expect(html).toContain('First quotation page');});
