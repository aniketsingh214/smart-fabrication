import { expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { POST } from '@/app/api/v1/notifications/[id]/read/route';
vi.mock('@/lib/auth/request',()=>({requestContext:vi.fn()}));
it('keeps the original read timestamp and scopes both queries to the actor',async()=>{
 const target=crypto.randomUUID(),read_at='2026-10-15T10:00:00Z';
 const query={update:vi.fn(),eq:vi.fn(),is:vi.fn(),select:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:{id:target,read_at},error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};
 for(const key of ['update','eq','is','select'] as const)query[key].mockReturnValue(query);
 vi.mocked(requestContext).mockResolvedValue({db:{from:()=>query},user:{id:'actor'}} as unknown as Awaited<ReturnType<typeof requestContext>>);
 const response=await POST(new NextRequest('http://localhost/api/v1/notifications/'+target+'/read',{method:'POST'}),{params:Promise.resolve({id:target})});
 expect(response.status).toBe(200);expect((await response.json()).data.read_at).toBe(read_at);expect(query.is).toHaveBeenCalledWith('read_at',null);expect(query.eq.mock.calls.filter(args=>args[0]==='user_id')).toEqual([['user_id','actor'],['user_id','actor']]);
 query.maybeSingle.mockResolvedValue({data:null,error:null} as never);
 const missing=await POST(new NextRequest('http://localhost/api/v1/notifications/'+target+'/read',{method:'POST'}),{params:Promise.resolve({id:target})});expect(missing.status).toBe(404);
});
