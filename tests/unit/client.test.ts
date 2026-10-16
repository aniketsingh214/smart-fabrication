import { describe,it,expect,vi,afterEach } from 'vitest';
import { SmartFabricationClient } from '@/contracts/client';
afterEach(()=>vi.unstubAllGlobals());
describe('Mobile bearer contract',()=>{
 it('uses bearer auth independently of cookies and preserves idempotency key',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({data:{id:'order'},meta:{},requestId:'request'})});vi.stubGlobal('fetch',fetcher);const client=new SmartFabricationClient('https://example.com/api/v1',async()=>'access-token');await client.request('/orders',{method:'POST',body:{quote:'q'},idempotencyKey:'key'});expect(fetcher.mock.calls[0][1].headers).toMatchObject({Authorization:'Bearer access-token','Idempotency-Key':'key'});expect(fetcher.mock.calls[0][1].credentials).toBeUndefined();});
 it('retains status, error code and request ID on denied access',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403,json:async()=>({error:{code:'FORBIDDEN',message:'Denied'},requestId:'trace'})}));await expect(new SmartFabricationClient('https://example.com/api/v1').request('/admin/users')).rejects.toMatchObject({status:403,code:'FORBIDDEN',requestId:'trace'});});
});
