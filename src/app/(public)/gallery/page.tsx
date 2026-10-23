import Image from 'next/image';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { DataTablePagination } from '@/components/data-table-pagination';
import { browseHref, publicCursor, publicCursorFilter, publicPageSize, publicWindow, type BrowseQuery } from '@/features/catalog/public-pagination';
export const metadata = { title: 'Our work' };
export default async function Gallery({ searchParams }: { searchParams: Promise<BrowseQuery> }) {
  let cursor;
  try { cursor = publicCursor((await searchParams).cursor); }
  catch { return <section className="mx-auto max-w-7xl px-5 py-14"><h1 className="text-3xl font-bold">Our work</h1><p role="alert" className="mt-5">This gallery page link is invalid.</p><Link href="/gallery" className="mt-4 inline-block underline">Return to first page</Link></section>; }
  const db = await serverClient();
  let query = db.from('gallery_items').select('id,name,alt_text,created_at,media_assets(public_id,resource_type)', { count: 'exact' }).eq('status', 'published').eq('consent_confirmed', true).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(publicPageSize + 1);
  if (cursor) query = query.or(publicCursorFilter(cursor));
  const { data, count: totalCount, error } = await query, { items, nextCursor } = publicWindow(data ?? []);
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="eyebrow text-orange-600">From the workshop</p><h1 className="mt-3 text-4xl font-bold">Our work</h1><p className="mt-3 text-sm text-slate-500">Completed projects and workshop details, shared with permission.</p>
    {error ? <p role="alert" className="card mt-8 p-8 text-red-600">Gallery could not be loaded.</p> : !items.length ? <div className="card mt-8 p-12 text-center text-sm text-slate-500">{cursor ? 'No further projects on this page. Return to the first page to browse again.' : 'Project photographs will appear here once published by our team.'}</div> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(g => { const asset = Array.isArray(g.media_assets) ? g.media_assets[0] : g.media_assets; return <article key={g.id} className="card overflow-hidden">{cloud && asset?.resource_type === 'image' && <Image src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_900/${asset.public_id}`} width={900} height={600} alt={g.alt_text} className="aspect-[3/2] w-full object-cover"/>}<h2 className="p-5 text-sm font-bold">{g.name}</h2></article>; })}</div>}
    {items.length > 0 && (cursor || nextCursor) && (
      <div className="mt-10">
        <DataTablePagination
          ariaLabel="Gallery pages"
          currentCount={items.length}
          totalCount={totalCount}
          pageSize={publicPageSize}
          hasPreviousPage={!!cursor}
          hasNextPage={!error && !!nextCursor}
          firstPageHref={browseHref('/gallery', {})}
          nextPageHref={nextCursor ? browseHref('/gallery', {}, nextCursor) : undefined}
          nextPageLabel="More projects"
          entityName="projects"
        />
      </div>
    )}
  </section>;
}