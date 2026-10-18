import { afterEach,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/estimates/preview/route';
import { requestContext } from '@/lib/auth/request';
vi.mock('@/lib/auth/request',()=>({requestContext:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
function request(){return new NextRequest('http://localhost/api/v1/estimates/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:crypto.randomUUID(),bom_id:crypto.randomUUID(),rule_id:crypto.randomUUID(),width_mm:1000,height_mm:2000})});}
it('requires catalog read in addition to materials read before calling the preview RPC',async()=>{const rpc=vi.fn().mockResolvedValue({data:false,error:null});vi.mocked(requestContext).mockResolvedValue({db:{rpc}} as unknown as Awaited<ReturnType<typeof requestContext>>);expect((await POST(request())).status).toBe(403);expect(requestContext).toHaveBeenCalledWith(expect.any(NextRequest),'materials.read');expect(rpc).toHaveBeenCalledTimes(1);expect(rpc).toHaveBeenCalledWith('has_permission',{requested:'catalog.read'});});
it('refuses malformed preview output and never returns an issued ID or raw database fields',async()=>{const rpc=vi.fn().mockImplementation(async(name:string)=>({data:name==='has_permission'?true:{preview:true,id:crypto.randomUUID(),private_internal:'hidden'},error:null}));vi.mocked(requestContext).mockResolvedValue({db:{rpc}} as unknown as Awaited<ReturnType<typeof requestContext>>);const response=await POST(request());expect(response.status).toBe(500);const body=await response.json();expect(body.error.code).toBe('INVALID_ESTIMATE_RESPONSE');expect(body.data).toBeUndefined();expect(JSON.stringify(body)).not.toContain('private_internal');});
