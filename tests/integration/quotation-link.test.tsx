import { expect,it,vi } from 'vitest';
import Account from '@/app/account/page';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server',()=>({serverClient:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error('REDIRECT '+path);}}));
const id='4680609d-5a18-4fcb-8dee-f0d89ee413c5';
function setup(loggedIn:boolean,permissions:string[]=[]){const query={select:()=>query,eq:()=>query,single:async()=>({data:{display_name:'Fixture',disabled:false}})};vi.mocked(serverClient).mockResolvedValue({auth:{getUser:async()=>({data:{user:loggedIn?{id:'fixture'}:null}})},from:()=>query,rpc:async()=>({data:permissions})} as unknown as Awaited<ReturnType<typeof serverClient>>);}
it('keeps quotation target through sign in in a new browser',async()=>{setup(false);await expect(Account({searchParams:Promise.resolve({quotation:id})})).rejects.toThrow('REDIRECT /login?next='+encodeURIComponent('/account?quotation='+id));});
it('opens the exact staff quotation rather than a customer-only list',async()=>{setup(true,['quotations.read']);await expect(Account({searchParams:Promise.resolve({quotation:id})})).rejects.toThrow('/admin/quotations?record='+id);});
it('keeps customers in their RLS-protected account and does not trust malformed ids',async()=>{setup(true,[]);expect(await Account({searchParams:Promise.resolve({quotation:id})})).toBeTruthy();setup(true,['quotations.read']);expect(await Account({searchParams:Promise.resolve({quotation:'invalid'})})).toBeTruthy();});
