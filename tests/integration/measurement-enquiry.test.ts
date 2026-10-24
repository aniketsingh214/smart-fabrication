import { afterEach,it,expect,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/[...segments]/route';
import { serverClient } from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server',()=>({serverClient:vi.fn()}));
vi.mock('@/lib/cloudinary/guest-token',()=>({enquiryUploadToken:()=> 'test-capability'}));
afterEach(()=>{vi.resetAllMocks();vi.useRealTimers();});
const input=()=>({name:'Test customer',phone:'9876543210',city:'Jhansi',requirement:'Need a custom steel gate',measurement_request:{preferred_date:'2026-11-01',time_window:'afternoon',address:'Test site address, Jhansi',postal_code:'284001'}});
const request=(payload:unknown)=>new NextRequest('http://localhost/api/v1/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
it('persists validated visit preferences in the existing lead workflow with normalized phone',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-25T00:00:00Z'));
 const rpc=vi.fn().mockResolvedValue({data:crypto.randomUUID(),error:null});vi.mocked(serverClient).mockResolvedValue({rpc} as unknown as Awaited<ReturnType<typeof serverClient>>);
 const response=await POST(request(input()),{params:Promise.resolve({segments:['leads']})});expect(response.status).toBe(201);
 const payload=rpc.mock.calls[0][1].payload;expect(payload.phone).toBe('+919876543210');expect(payload.requirement).toContain('Preferred date: 2026-11-01');expect(payload.requirement).toContain('not a confirmed appointment');expect(payload.measurement_request).toBeUndefined();
});
it('rejects malformed visit preferences before any business write',async()=>{
 const value=input();value.measurement_request.postal_code='bad';const response=await POST(request(value),{params:Promise.resolve({segments:['leads']})});expect(response.status).toBe(422);expect(serverClient).not.toHaveBeenCalled();
});
