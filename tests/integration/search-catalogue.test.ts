import {afterEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {GET} from '@/app/api/v1/search/catalogue/route';
import {serverClient} from '@/lib/supabase/server';
vi.mock('@/lib/supabase/server',()=>({serverClient:vi.fn()}));
afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs();});
function setup(visibility='public'){
 vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME','catalog-test');const row={id:'11111111-1111-4111-8111-111111111111',name:'Actual Gate',sku:'GT-1',slug:'actual-gate',material:'Steel',price_min_minor:250050,featured:true,updated_at:'2026-11-04T00:00:00Z',created_at:'2026-11-04T00:00:00Z',categories:{name:'Main Gates',slug:'main-gates'},product_media:[{id:'link',sort_order:0,media_assets:{id:'asset',public_id:'actual/image',resource_type:'image',visibility}}]};
 const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),or:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:[row],error:null}).then(resolve)};
 vi.mocked(serverClient).mockResolvedValue({from:vi.fn().mockReturnValue(query)} as never);return query;
}
it('exposes actual published product data, price and public-image URLs without seeded entries',async()=>{const query=setup();const response=await GET(new NextRequest('http://localhost/api/v1/search/catalogue'));expect(response.status).toBe(200);const data=(await response.json()).data;expect(data.items).toHaveLength(1);expect(data.items[0]).toMatchObject({name:'Actual Gate',priceMinor:250050,slug:'actual-gate',category:'Main Gates'});expect(query.eq).toHaveBeenCalledWith('status','published');expect(data.items[0].embeddingUrl).toContain('f_jpg');});
it('never exposes private reference photos as catalogue search images',async()=>{setup('private');const response=await GET(new NextRequest('http://localhost/api/v1/search/catalogue'));expect((await response.json()).data.items).toEqual([]);});
it('reports missing image configuration rather than returning invented designs',async()=>{setup();vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME','');expect((await GET(new NextRequest('http://localhost/api/v1/search/catalogue'))).status).toBe(503);});
