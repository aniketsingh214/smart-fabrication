import { describe,it,expect,vi,beforeEach,afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { requestContext } from '@/lib/auth/request';
vi.mock('@/lib/supabase/server',()=>({serverClient:vi.fn()}));
const userId='c79bd6d8-03bc-48f2-80f8-5d7d4df6b120';
function client({user=true,disabled=false,allowed=true}:{user?:boolean;disabled?:boolean;allowed?:boolean}={}){
 const db={auth:{getUser:vi.fn().mockResolvedValue({data:{user:user?{id:userId}:null},error:user?null:{message:'Invalid token'}})},from:vi.fn().mockReturnValue({select:vi.fn().mockReturnValue({eq:vi.fn().mockReturnValue({single:vi.fn().mockResolvedValue({data:{id:userId,display_name:'Test user',disabled},error:null})})})}),rpc:vi.fn().mockResolvedValue({data:allowed,error:null})};
 vi.mocked(serverClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof serverClient>>);return db;
}
const request=(method='GET',headers:Record<string,string>={})=>new NextRequest('http://localhost:3000/api/v1/admin/leads',{method,headers});
describe('Server authentication, permission and cookie boundaries',()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('NEXT_PUBLIC_APP_URL','http://localhost:3000');});afterEach(()=>vi.unstubAllEnvs());
 it('rejects unauthenticated reads',async()=>{client({user:false});await expect(requestContext(request(),'leads.read')).rejects.toMatchObject({status:401});});
 it('rejects cookie mutations without a trusted origin before database work',async()=>{client();await expect(requestContext(request('POST'),'leads.write')).rejects.toMatchObject({status:403,code:'CSRF_REJECTED'});expect(serverClient).not.toHaveBeenCalled();});
 it('rejects cross-origin cookie mutations',async()=>{client();await expect(requestContext(request('POST',{Origin:'https://attacker.example'}),'leads.write')).rejects.toMatchObject({status:403});});
 it('allows a same-origin active authorized actor',async()=>{client();await expect(requestContext(request('POST',{Origin:'http://localhost:3000'}),'leads.write')).resolves.toMatchObject({user:{id:userId}});});
 it('uses verified bearer identity independently of cookie Origin',async()=>{const db=client();await requestContext(request('POST',{Authorization:'Bearer access-token'}),'leads.write');expect(serverClient).toHaveBeenCalledWith('access-token');expect(db.auth.getUser).toHaveBeenCalledWith('access-token');});
 it('rejects forged or expired bearer tokens when Auth validation fails',async()=>{client({user:false});await expect(requestContext(request('GET',{Authorization:'Bearer forged-token'}),'leads.read')).rejects.toMatchObject({status:401});});
 it('denies disabled actors and revoked permissions',async()=>{client({disabled:true});await expect(requestContext(request(),'leads.read')).rejects.toMatchObject({status:403,code:'ACCOUNT_DISABLED'});client({allowed:false});await expect(requestContext(request(),'leads.read')).rejects.toMatchObject({status:403,code:'FORBIDDEN'});});
 it('supports explicitly authorized alternative workflow permissions',async()=>{const db=client({allowed:false});db.rpc.mockImplementation(async(_name,args)=>({data:args.requested==='production.write',error:null}));await expect(requestContext(request(),['production.write','inventory.approve'])).resolves.toMatchObject({user:{id:userId}});});
});
