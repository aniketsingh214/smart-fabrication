import { DemoPhotography } from '@/components/demo-photography';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { serverClient } from '@/lib/supabase/server';
import { money } from '@/lib/utils';
import { ProductVisual } from '@/components/product-visual';
import { browseHref, publicCursor, publicCursorFilter, publicPageSize, publicWindow, singleQuery, type BrowseQuery } from '@/features/catalog/public-pagination';
export const metadata = { title: 'Explore fabrication designs' };
export default async function Catalog({ searchParams }: { searchParams: Promise<BrowseQuery> }) {
  const params = await searchParams, q = singleQuery(params.q).slice(0, 120), category = singleQuery(params.category);
  let cursor;
  try { cursor = publicCursor(params.cursor); }
  catch { return <div className="mx-auto max-w-7xl px-5 py-12"><h1 className="text-3xl font-bold">Designs for your space</h1><p role="alert" className="mt-5">This catalog page link is invalid.</p><Link className="mt-4 inline-block underline" href={browseHref('/catalog', { q, category })}>Return to first page</Link></div>; }
  const db = await serverClient();
  const { data: categories } = await db.from('categories').select('id,name').eq('active', true).order('sort_order');
  let query = db.from('products').select('id,name,slug,description,material,price_min_minor,price_max_minor,created_at,product_media(alt_text,sort_order,media_assets(public_id,resource_type,visibility))').eq('status', 'published').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(publicPageSize + 1);
  if (q) query = query.ilike('name', `%${q.replace(/[%_\\]/g, '')}%`);
  if (category) query = query.eq('category_id', category);
  if (cursor) query = query.or(publicCursorFilter(cursor));
  const { data, error } = await query, { items: products, nextCursor } = publicWindow(data ?? []);
  return <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
    <p className="eyebrow text-orange-600">Explore the possibilities</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Designs for your space</h1><p className="mt-3 text-sm text-slate-500">Choose a starting point. Dimensions and finishing can be tailored to your project.</p>
    <form className="my-8 flex flex-wrap gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input name="q" aria-label="Search designs" placeholder="Search gates, grills, railings…" defaultValue={q} className="!pl-10"/></div><select aria-label="Filter category" name="category" defaultValue={category} className="!w-auto"><option value="">All categories</option>{categories?.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select><button type="submit" className="rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white">Search</button></form>
    {error ? <p role="alert" className="card p-8 text-red-600">We could not load the catalog. Please try again.</p> : !products.length ? <section className="card p-12 text-center"><h2 className="text-xl font-bold">Let’s create something for you</h2><p className="mt-3 text-sm text-slate-500">{cursor ? 'No further designs on this page. Return to the first page to browse again.' : q ? 'No published designs match this search.' : 'Our design catalog is being prepared. You can still request custom fabrication.'}</p><Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">Discuss a custom project <ArrowUpRight size={16}/></Link></section> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map(p => <Link href={`/catalog/${p.slug}`} key={p.id} className="card overflow-hidden"><ProductVisual media={p.product_media} alt={p.name} className="aspect-[3/2] w-full object-cover"/><div className="p-5"><div className="mb-3 text-[10px] uppercase tracking-widest text-orange-600">{p.material}</div><h2 className="text-lg font-bold">{p.name}</h2><p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{p.description}</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-4"><span className="text-sm font-semibold">{p.price_min_minor ? `From ${money(p.price_min_minor)}` : 'Request a quotation'}</span><ArrowUpRight size={18} className="text-orange-600"/></div></div></Link>)}</div>}
    {(cursor || nextCursor) && <nav aria-label="Catalog pages" className="mt-8 flex flex-wrap gap-5 text-sm font-semibold underline">{cursor && <Link href={browseHref('/catalog', { q, category })}>First page</Link>}{!error && nextCursor && <Link href={browseHref('/catalog', { q, category }, nextCursor)}>More designs</Link>}</nav>}
    {!error && !products.length && !q && !category && !cursor && <DemoPhotography/>}
  </div>;
}