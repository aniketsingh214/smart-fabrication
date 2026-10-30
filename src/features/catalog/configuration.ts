import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductVariant,ProductOption } from '@/contracts/catalog';
import { z } from 'zod';
import { databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function catalogConfiguration(db:SupabaseClient,id:string,preview=false){
 z.uuid().parse(id);
 let query=db.from('products').select('id,name,slug,sku,description,weight_kg,design_code,design_details,material,finish,custom_size,delivery_availability,installation_availability,price_min_minor,price_max_minor,status,category_id,categories(id,name),product_media(id,media_id,alt_text,sort_order,media_assets(id,public_id,resource_type,visibility)),product_variants(id,name,sku,width_mm,height_mm,colour,finish,price_min_minor,price_max_minor,status),product_options(id,name,option_group,extra_cost_minor,sort_order,status)').eq('id',id);
 if(!preview)query=query.eq('status','published');
 const {data,error}=await query.maybeSingle();databaseError(error);if(!data)throw new AppError('NOT_FOUND','Product not found',404);
 return {...data,product_variants:(data.product_variants as ProductVariant[]).filter(v=>preview||v.status==='published'),product_options:(data.product_options as ProductOption[]).filter(o=>preview||o.status==='published').sort((a,b)=>a.sort_order-b.sort_order)};
}

