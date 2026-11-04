import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { ProductVisual } from '@/components/product-visual';

export async function FeaturedProducts() {
  const db = await serverClient();
  const { data, error } = await db.from('products').select('id,name,slug,material,product_media(alt_text,sort_order,media_assets(public_id,resource_type,visibility))').eq('status', 'published').eq('featured', true).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(6);
  if (error) return <p role="alert" className="mx-auto max-w-7xl px-5 py-6 text-sm text-red-700">Featured designs could not be loaded.</p>;
  if (!data?.length) return null;
  return <section aria-labelledby="featured-designs" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-blue-600">Selected by the workshop</p><h2 id="featured-designs" className="mt-3 text-3xl font-bold text-slate-900">Featured designs</h2></div><Link href="/catalog" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Explore all designs →</Link></div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map(product => <Link href={`/catalog/${product.slug}`} key={product.id} className="card overflow-hidden transition-all duration-200 hover:border-blue-300 hover:shadow-md"><ProductVisual media={product.product_media} alt={product.name} className="aspect-[3/2] w-full object-cover"/><div className="p-5"><p className="text-xs text-slate-500">{product.material}</p><h3 className="mt-2 font-semibold text-slate-900">{product.name}</h3><p className="mt-3 text-xs font-semibold text-blue-600">View design &amp; details →</p></div></Link>)}</div>
  </section>;
}
