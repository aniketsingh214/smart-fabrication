import { ProductServices } from '@/features/catalog/product-services';
import { ProductVideos } from '@/features/catalog/product-videos';
import { redirect,notFound } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { catalogConfiguration } from '@/features/catalog/configuration';
import { ProductConfiguration } from '@/features/catalog/product-configuration';
import { ProductVisual } from '@/components/product-visual';
import { AppError } from '@/lib/errors';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function ProductPreview({params}:{params:Promise<{id:string}>}){
 const db=await serverClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');const {data:allowed}=await db.rpc('has_permission',{requested:'catalog.read'});if(!allowed)notFound();
 let product;try{product=await catalogConfiguration(db,(await params).id,true);}catch(e){if(e instanceof AppError&&e.status===404)notFound();throw e;}
 return <div className="max-w-4xl"><p className="mb-5 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">Private staff preview · {product.status}. Draft choices shown here are hidden from the public catalog.</p><h1 className="mb-5 text-3xl font-bold">{product.name}</h1><ProductVisual media={product.product_media} alt={product.name} className="max-w-xl rounded-xl"/><p className="mt-5 whitespace-pre-wrap text-sm leading-7">{product.description}</p><ProductVideos media={product.product_media}/><ProductServices delivery={product.delivery_availability} installation={product.installation_availability}/><ProductConfiguration variants={product.product_variants} options={product.product_options} preview/></div>;
}

