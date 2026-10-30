import {it,expect,vi,afterEach} from 'vitest';
import {uploadImage} from '@/features/media/upload';
import {prepareProductImages,attachProductImages} from '@/features/catalog/product-image-save';
vi.mock('@/features/media/upload',()=>({uploadImage:vi.fn()}));
afterEach(()=>{vi.restoreAllMocks();vi.clearAllMocks();});
const image=(id:string)=>({id,file:{name:id+'.png'} as File});
it('keeps verified image IDs on a partial upload failure and retries only unfinished uploads',async()=>{
 const images=[image('cover'),image('gallery')],assets=new Map<string,string>();vi.mocked(uploadImage).mockResolvedValueOnce({id:'asset-cover'}).mockRejectedValueOnce(Error('Upload failed')).mockResolvedValueOnce({id:'asset-gallery'});
 await expect(prepareProductImages(images,assets,vi.fn())).rejects.toThrow('Upload failed');await prepareProductImages(images,assets,vi.fn());expect(uploadImage).toHaveBeenCalledTimes(3);expect(assets.size).toBe(2);expect(uploadImage).toHaveBeenLastCalledWith(images[1].file,'product');
});
it('links cover first and skips an already saved link after a lost response',async()=>{
 const images=[image('cover'),image('gallery')],assets=new Map([['cover','a'],['gallery','b']]),linked=new Set<string>();const fetcher=vi.spyOn(globalThis,'fetch');fetcher.mockResolvedValueOnce(new Response(JSON.stringify({data:[{media_id:'a'}]}))).mockResolvedValueOnce(new Response(JSON.stringify({data:[]}))).mockResolvedValueOnce(new Response(JSON.stringify({data:{id:'link-b'}})));
 await attachProductImages('product','Gate',images,assets,linked,vi.fn());expect(fetcher).toHaveBeenCalledTimes(3);expect(JSON.parse(String(fetcher.mock.calls[2][1]?.body))).toEqual({product_id:'product',media_id:'b',alt_text:'Gate photo 2',sort_order:1});expect([...linked]).toEqual(['cover','gallery']);
});
it('retains successfully attached items when a later link fails; retry avoids duplicates',async()=>{
 const images=[image('a'),image('b')],assets=new Map([['a','asset-a'],['b','asset-b']]),linked=new Set<string>();const fetcher=vi.spyOn(globalThis,'fetch');const ok=()=>new Response(JSON.stringify({data:[]}));fetcher.mockResolvedValueOnce(ok()).mockResolvedValueOnce(new Response(JSON.stringify({data:{id:'saved-a'}}))).mockResolvedValueOnce(ok()).mockResolvedValueOnce(new Response(JSON.stringify({error:{message:'Link failed'}}),{status:500}));
 await expect(attachProductImages('product','Gate',images,assets,linked,vi.fn())).rejects.toThrow();expect([...linked]).toEqual(['a']);fetcher.mockResolvedValueOnce(ok()).mockResolvedValueOnce(new Response(JSON.stringify({data:{id:'saved-b'}})));await attachProductImages('product','Gate',images,assets,linked,vi.fn());expect(JSON.parse(String(fetcher.mock.calls[5][1]?.body)).media_id).toBe('asset-b');expect(linked.size).toBe(2);
});
