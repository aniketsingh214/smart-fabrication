import { z } from 'zod';
import { serverClient } from '@/lib/supabase/server';
import { CalculationPreview } from '@/features/estimates/preview-form';
export default async function PreviewPage({searchParams}:{searchParams:Promise<{product?:string;rule?:string}>}){
 const db=await serverClient();const checks=await Promise.all(['materials.read','catalog.read'].map(requested=>db.rpc('has_permission',{requested})));if(!checks.every(check=>!check.error&&check.data))return <p>Calculation preview access is restricted.</p>;
 const params=await searchParams,product=z.uuid().safeParse(params.product),rule=z.uuid().safeParse(params.rule);
 return <><h1 className="mb-4 text-3xl font-bold">Calculation preview</h1><CalculationPreview product={product.success?product.data:undefined} rule={rule.success?rule.data:undefined}/></>;
}
