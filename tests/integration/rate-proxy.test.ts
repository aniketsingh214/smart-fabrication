import { afterEach,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy,config } from '@/proxy';
import { enforceRequestLimit,RateLimitError } from '@/lib/rate-limit';
vi.mock('@/lib/rate-limit',async(importOriginal)=>({...await importOriginal<typeof import('@/lib/rate-limit')>(),enforceRequestLimit:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
it('matches the entire application API so future write forms inherit protection',()=>{expect(config.matcher).toContain('/api/v1/:path*');});
it('blocks before route code and preserves response headers',async()=>{vi.mocked(enforceRequestLimit).mockRejectedValue(new RateLimitError(12,6,1900000000));const response=await proxy(new NextRequest('https://example.com/api/v1/admin/products',{method:'POST'}));expect(response.status).toBe(429);expect(response.headers.get('Retry-After')).toBe('12');});
it('forwards permitted API calls with non-PII quota headers',async()=>{vi.mocked(enforceRequestLimit).mockResolvedValue({allowed:true,remaining:4,retry_after:20,reset_at:1900000000,limit:6});const response=await proxy(new NextRequest('https://example.com/api/v1/leads',{method:'POST'}));expect(response.headers.get('X-RateLimit-IP-Remaining')).toBe('4');expect(response.headers.get('x-middleware-next')).toBe('1');});
