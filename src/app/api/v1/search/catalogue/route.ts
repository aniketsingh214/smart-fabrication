import {AppError} from '@/lib/errors';
import {NextRequest} from 'next/server';
import {serverClient} from '@/lib/supabase/server';
import {success,failure,databaseError} from '@/lib/api';
import {parseCursor} from '@/features/operations/services';
import type {DiscoveryProduct} from '@/features/search/discovery';
export async function GET(request:NextRequest){const requestId=crypto.randomUUID();try{
 const db=await serverClient();let query=db.from('products').select('id,name,sku,slug,material,price_min_minor,featured,updated_at,created_at,categories(name,slug),product_media(id,sort_order,media_assets(id,public_id,resource_type,visibility))').eq('status','published').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(101);
 const raw=request.nextUrl.searchParams.get('cursor');if(raw){const cursor=parseCursor(raw);query=query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);}
 const {data,error}=await query;databaseError(error);const page=(data??[]).slice(0,100),cloud=process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
 if(!cloud)throw new AppError('SEARCH_UNAVAILABLE','Catalogue images are not configured',503);
 const items:DiscoveryProduct[]=page.flatMap(product=>{const media=[...(product.product_media??[])].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).find(row=>{const asset=Array.isArray(row.media_assets)?row.media_assets[0]:row.media_assets;return asset?.resource_type==='image'&&asset.visibility==='public';});const asset=Array.isArray(media?.media_assets)?media.media_assets[0]:media?.media_assets;if(!asset?.public_id)return [];const category=Array.isArray(product.categories)?product.categories[0]:product.categories;const encoded=asset.public_id.split('/').map(encodeURIComponent).join('/');return [{id:product.id,name:product.name,sku:product.sku,slug:product.slug,material:product.material,priceMinor:Number(product.price_min_minor),featured:product.featured,category:category?.name??'Fabrication designs',categorySlug:category?.slug??'',imageUrl:`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_640/${encoded}`,embeddingUrl:`https://res.cloudinary.com/${cloud}/image/upload/f_jpg,q_80,w_384/${encoded}`,imageKey:asset.id+':'+product.updated_at}];});
 const last=page.at(-1);return success({items,nextCursor:(data?.length??0)>100&&last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null},requestId);
 }catch(error){return failure(error,requestId);}}
