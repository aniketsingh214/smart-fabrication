import { afterEach,it,expect,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { GET } from '@/app/api/v1/dashboard/route';
import Overview from '@/app/admin/page';
import { requestContext } from '@/lib/auth/request';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/auth/request',()=>({requestContext:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({serverClient:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
function fixture(){return {as_of:'2026-10-25T12:00:00+00:00',day_start:'2026-10-24T18:30:00+00:00',day_end:'2026-10-25T18:30:00+00:00',scope:'business',task:'all',page:1,page_size:10,metrics:{new_leads:2,active_leads:3,followups_due:1,overdue_followups:1,approvals:0,open_orders:2,deliveries_today:0,pending_installations:1},task_total:0,tasks:[],board:[],activity:[]};}
function apiFixture(data:unknown=fixture(),error:unknown=null){const rpc=vi.fn().mockResolvedValue({data,error});vi.mocked(requestContext).mockResolvedValue({db:{rpc}} as unknown as Awaited<ReturnType<typeof requestContext>>);return rpc;}
it('defaults API to business scope and supports any permitted operational reader',async()=>{
 const rpc=apiFixture();const response=await GET(new NextRequest('http://localhost/api/v1/dashboard'));expect(response.status).toBe(200);expect(requestContext).toHaveBeenCalledWith(expect.anything(),['leads.read','quotations.read','orders.read','delivery.read']);expect(rpc).toHaveBeenCalledWith('workshop_dashboard',{requested_scope:'business',requested_task:'all',requested_page:1});
});
it('rejects invalid dashboard filters before the RPC',async()=>{const rpc=apiFixture();expect((await GET(new NextRequest('http://localhost/api/v1/dashboard?scope=invalid&page=0'))).status).toBe(422);expect(rpc).not.toHaveBeenCalled();});
it('does not publish malformed or expanded private database fields',async()=>{apiFixture({...fixture(),private_ledger:'secret'});const response=await GET(new NextRequest('http://localhost/api/v1/dashboard'));expect(response.status).toBe(500);expect(JSON.stringify(await response.json())).not.toContain('private_ledger');});
it('propagates a real SQL permission denial instead of replacing it with zeros',async()=>{apiFixture(null,{code:'42501',message:'denied'});expect((await GET(new NextRequest('http://localhost/api/v1/dashboard'))).status).toBe(403);});
it('renders daily tasks, data controls, matched drilldown links and unscheduled installation explanation',async()=>{
 const rpc=vi.fn(async(name:string)=>({data:name==='my_permissions'?['leads.read','leads.write','orders.read','delivery.read']:fixture(),error:null}));vi.mocked(serverClient).mockResolvedValue({rpc} as unknown as Awaited<ReturnType<typeof serverClient>>);
 const html=renderToStaticMarkup(await Overview({searchParams:Promise.resolve({})}));expect(html).toContain('Aaj ka kaam');expect(html).toContain('Meri task list');expect(html).toContain('Dashboard data scope');expect(html).toContain('task=followup');expect(html).toContain('no separate scheduled installation date');expect(html).toContain('/admin/leads?new=1');expect(html).not.toContain('₹');
});
it('shows unavailable permissions as absent cards and preserves business/demo selection in tabs',async()=>{
 const data=fixture();data.scope='demo';data.metrics={...data.metrics,new_leads:null,active_leads:null} as unknown as typeof data.metrics;
 const rpc=vi.fn(async(name:string)=>({data:name==='my_permissions'?['orders.read']:data,error:null}));vi.mocked(serverClient).mockResolvedValue({rpc} as unknown as Awaited<ReturnType<typeof serverClient>>);
 const html=renderToStaticMarkup(await Overview({searchParams:Promise.resolve({scope:'demo'})}));expect(html).not.toContain('Nayi enquiries');expect(html).toContain('scope=demo');expect(html).toContain('not actual business performance');
});
it('rejects invalid page links without starting database queries',async()=>{const html=renderToStaticMarkup(await Overview({searchParams:Promise.resolve({page:'-1'})}));expect(html).toContain('Invalid dashboard filters');expect(serverClient).not.toHaveBeenCalled();});

it('makes all four lower metrics accessible links with explicit all-permitted-record scope',async()=>{const rpc=vi.fn(async(name:string)=>({data:name==='my_permissions'?['leads.read','orders.read','delivery.read']:fixture(),error:null}));vi.mocked(serverClient).mockResolvedValue({rpc} as unknown as Awaited<ReturnType<typeof serverClient>>);const html=renderToStaticMarkup(await Overview({searchParams:Promise.resolve({scope:'demo'})}));for(const slug of ['leads','orders','installations','follow-ups']){expect(html).toMatch(new RegExp('<a[^>]*href="/admin/'+slug+'"'));expect(html).toMatch(new RegExp('<a[^>]*class="admin-kpi[^>]*href="/admin/'+slug+'"|<a[^>]*href="/admin/'+slug+'"[^>]*class="admin-kpi'));}expect(html.match(/Open all permitted records/g)).toHaveLength(4);});
