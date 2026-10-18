import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { ProductVisual } from '@/components/product-visual';

export async function CategoryCards() {
  const db = await serverClient();
  const { data, error } = await db.from('categories').select('id,name,media_assets!categories_image_media_id_fkey(public_id,resource_type,visibility)').eq('active', true).is('parent_id', null).order('sort_order').order('id').limit(8);
  return <section aria-labelledby="planning-categories" className="bg-white py-14"><div className="mx-auto max-w-7xl px-5 lg:px-8">
    <div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow mb-3 text-orange-600">A place for every possibility</p><h2 id="planning-categories" className="text-3xl font-bold tracking-tight">What are you planning?</h2></div><Link href="/catalog" className="text-xs font-semibold text-orange-600">All categories</Link></div>
    {error ? <p role="alert">Categories could not be loaded. Please retry.</p> : !data?.length ? <p className="text-sm text-slate-500">Browse our designs or discuss your custom fabrication requirements.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.map(category => <Link href={`/catalog?category=${category.id}`} key={category.id} className="card overflow-hidden transition-colors hover:border-orange-300"><ProductVisual media={[{ alt_text: category.name, media_assets: category.media_assets }]} alt={category.name} className="aspect-[3/2] w-full object-cover"/><h3 className="p-5 text-base font-bold">{category.name}</h3></Link>)}</div>}
  </div></section>;
}
