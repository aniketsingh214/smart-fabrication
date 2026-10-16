import { expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { GET } from '@/app/api/v1/[...segments]/route';
vi.mock('@/lib/auth/request',()=>({requestContext:vi.fn()}));
it('returns resource rows directly in data and the next cursor in meta',async()=>{
 const rows=[{id:crypto.randomUUID(),name:'First',created_at:'2026-10-15T12:00:00Z'},{id:crypto.randomUUID(),name:'Older',created_at:'2026-10-14T12:00:00Z'}];
 const query={select:vi.fn(),order:vi.fn(),limit:vi.fn(),then:(resolve:(result:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};
 for(const method of ['select','order','limit'] as const)query[method].mockReturnValue(query);
 vi.mocked(requestContext).mockResolvedValue({db:{from:()=>query}} as unknown as Awaited<ReturnType<typeof requestContext>>);
 const response=await GET(new NextRequest('http://localhost/api/v1/admin/products?limit=1'),{params:Promise.resolve({segments:['admin','products']})});
 expect(response.status).toBe(200);const body=await response.json();expect(body.data).toEqual([rows[0]]);expect(body.meta.nextCursor).toBeTypeOf('string');expect(body.data.items).toBeUndefined();
 expect(JSON.parse(Buffer.from(body.meta.nextCursor,'base64url').toString()).id).toBe(rows[0].id);
});
