import { describe,it,expect,vi } from 'vitest';
import { jsonBody } from '@/lib/api';
const request=(body:string,contentType='application/json')=>new Request('http://localhost/api/v1/test',{method:'POST',headers:{'Content-Type':contentType},body});
describe('Bounded JSON input',()=>{
 it('accepts JSON with charset and rejects malformed content',async()=>{await expect(jsonBody(request('{"name":"gate"}','application/json; charset=utf-8'))).resolves.toEqual({name:'gate'});await expect(jsonBody(request('{bad'))).rejects.toMatchObject({status:400});});
 it('does not treat a misleading content type as JSON',async()=>expect(jsonBody(request('{}','application/json-malicious'))).rejects.toMatchObject({status:415}));
 it('enforces byte limits for multibyte text',async()=>expect(jsonBody(request(`{"text":"${'💥'.repeat(20000)}"}`))).rejects.toMatchObject({status:413}));
 it('cancels an oversized stream without reading the entire input',async()=>{const cancel=vi.fn();let pulls=0;const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(32768));},cancel});const r=new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:stream,duplex:'half'} as RequestInit);await expect(jsonBody(r)).rejects.toMatchObject({status:413});expect(cancel).toHaveBeenCalledOnce();expect(pulls).toBeLessThanOrEqual(4);});
});
