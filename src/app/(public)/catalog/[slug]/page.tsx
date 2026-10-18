import { ProductServices } from '@/features/catalog/product-services';
import { ProductVideos } from '@/features/catalog/product-videos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ProductVisual } from '@/components/product-visual';
import { money } from '@/lib/utils';
import { catalogConfiguration } from '@/features/catalog/configuration';
import { ProductConfiguration } from '@/features/catalog/product-configuration';
export default async function Product({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const db=await serverClient();const {data:productRef,error}=await db.from('products').select('id').eq('slug',slug).eq('status','published').maybeSingle();if(error)throw new Error('Product could not be loaded');if(!productRef)notFound();const choices=await catalogConfiguration(db,productRef.id);const p=choices;return <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><Link href="/catalog" className="text-xs text-slate-500">← Back to designs</Link><div className="mt-6 grid gap-10 lg:grid-cols-2"><div><ProductVisual media={p.product_media} alt={p.name} className="w-full rounded-2xl"/><ProductVideos media={p.product_media}/></div><div><p className="eyebrow text-orange-600">Custom fabrication</p><h1 className="mt-3 text-4xl font-bold">{p.name}</h1><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-500">{p.description}</p><dl className="my-7 grid grid-cols-2 gap-5 rounded-xl border border-slate-200 bg-white p-5">{[['Material',p.material],...(p.design_code?[['Design code',p.design_code]]:[]),...(p.weight_kg?[['Indicative weight',String(p.weight_kg)+' kg']]:[]),['Finish',p.finish||'Discuss with the workshop'],['Dimensions',p.custom_size?'Made to measure':'As specified'],['Indicative starting price',p.price_min_minor?money(p.price_min_minor):'Quotation on request']].map(([k,v])=><div key={k}><dt className="text-xs text-slate-400">{k}</dt><dd className="mt-2 text-sm font-semibold">{v}</dd></div>)}</dl>{p.design_details&&<p className="mb-5 whitespace-pre-wrap text-sm text-slate-600">{p.design_details}</p>}<ProductServices delivery={p.delivery_availability} installation={p.installation_availability}/><ProductConfiguration variants={choices.product_variants} options={choices.product_options}/><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href={`/contact?product=${p.id}`}>Request exact quotation</Link></Button><Button asChild variant="outline"><Link href={`/estimate?product=${p.id}`}>Get approximate estimate</Link></Button></div><p className="mt-4 text-xs leading-6 text-slate-400">Where product photography is unavailable, a concept illustration is shown. Final dimensions and price are confirmed after measurement.</p></div></div></div>;}




