import { describe,it,expect,vi,afterEach } from 'vitest';
import { SmartFabricationClient } from '@/contracts/client';
afterEach(()=>vi.unstubAllGlobals());
describe('Mobile bearer contract',()=>{
 it('uses bearer auth independently of cookies and preserves idempotency key',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({data:{id:'order'},meta:{},requestId:'request'})});vi.stubGlobal('fetch',fetcher);const client=new SmartFabricationClient('https://example.com/api/v1',async()=>'access-token');await client.request('/orders',{method:'POST',body:{quote:'q'},idempotencyKey:'key'});expect(fetcher.mock.calls[0][1].headers).toMatchObject({Authorization:'Bearer access-token','Idempotency-Key':'key'});expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'omit',redirect:'error',cache:'no-store'});});
 it('retains status, error code and request ID on denied access',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403,json:async()=>({error:{code:'FORBIDDEN',message:'Denied'},requestId:'trace'})}));await expect(new SmartFabricationClient('https://example.com/api/v1').request('/admin/users')).rejects.toMatchObject({status:403,code:'FORBIDDEN',requestId:'trace'});});
});
it('preserves status and correlation ID for non-JSON responses without replaying writes',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response('<html>Unavailable</html>',{status:503,headers:{'X-Request-ID':'proxy-trace'}}));vi.stubGlobal('fetch',fetcher);
 await expect(new SmartFabricationClient('https://example.com/api/v1').request('/orders',{method:'POST',body:{},idempotencyKey:'original'})).rejects.toMatchObject({status:503,code:'INVALID_RESPONSE',requestId:'proxy-trace'});expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rejects malformed success and paths that escape the API base before acquiring credentials',async()=>{
 const fetcher=vi.fn().mockResolvedValue(Response.json({data:[]})),token=vi.fn().mockResolvedValue('fresh');vi.stubGlobal('fetch',fetcher);const client=new SmartFabricationClient('https://example.com/api/v1',token);
 for(const path of ['//evil.invalid','/../admin','/%2e%2e/admin','/\\evil.invalid','/me#fragment'])await expect(client.request(path)).rejects.toThrow();expect(token).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled();
 await expect(client.request('/me')).rejects.toMatchObject({code:'INVALID_RESPONSE',status:200});
});
it('requires secure remote bases, permits loopback development and reads a fresh token on each request',async()=>{
 for(const url of ['http://example.com/api/v1','https://user:password@example.com/api/v1','https://example.com/api/v1?key=secret'])expect(()=>new SmartFabricationClient(url)).toThrow();
 const fetcher=vi.fn().mockImplementation(async()=>Response.json({data:[],meta:{nextCursor:null},requestId:'trace'})),token=vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('refreshed');vi.stubGlobal('fetch',fetcher);
 const client=new SmartFabricationClient('http://localhost:3000/api/v1',token);await client.request('/notifications?limit=1');await client.request('/notifications?limit=1');expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer first');expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer refreshed');
});
