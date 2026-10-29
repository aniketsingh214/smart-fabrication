import { ValidatedForm } from '@/components/validated-form';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { serverClient } from '@/lib/supabase/server';
import { DataTablePagination } from '@/components/data-table-pagination';
import { browseHref, publicCursor, publicCursorFilter, publicPageSize, publicWindow, singleQuery, type BrowseQuery } from '@/features/catalog/public-pagination';
import { getServerLocale } from '@/lib/i18n/server';

export const metadata = { title: 'Our work' };

export default async function Gallery({ searchParams }: { searchParams: Promise<BrowseQuery> }) {
  const params = await searchParams;
  const q = singleQuery(params.q).slice(0, 120);
  const locale = await getServerLocale();
  const isHi = locale === 'hi';

  let cursor;
  try {
    cursor = publicCursor(params.cursor);
  } catch {
    return (
      <section className="mx-auto max-w-7xl px-5 py-14">
        <h1 className="text-3xl font-bold">Our work</h1>
        <p role="alert" className="mt-5">This gallery page link is invalid.</p>
        <Link href={browseHref('/gallery', { q })} className="mt-4 inline-block underline">
          Return to first page
        </Link>
      </section>
    );
  }

  const db = await serverClient();
  let query = db
    .from('gallery_items')
    .select('id,name,alt_text,created_at,media_assets(public_id,resource_type)', { count: 'exact' })
    .eq('status', 'published')
    .eq('consent_confirmed', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(publicPageSize + 1);

  if (q) {
    const cleanQ = q.replace(/[%_\\]/g, '');
    query = query.ilike('name', `%${cleanQ}%`);
  }

  if (cursor) query = query.or(publicCursorFilter(cursor));

  const { data, count: totalCount, error } = await query;
  const { items, nextCursor } = publicWindow(data ?? []);
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header and Search */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="eyebrow text-orange-600">{isHi ? 'वर्कशॉप प्रोजेक्ट्स' : 'From the workshop'}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl text-slate-900">
            {isHi ? 'हमारा काम (Our Work)' : 'Our work'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl">
            {isHi
              ? 'वर्कशॉप में तैयार किए गए असली प्रोजेक्ट्स और इंस्टॉलेशन की तस्वीरें।'
              : 'Completed projects and workshop details, shared with permission.'}
          </p>
        </div>

        {/* Gallery Search Form */}
        <div className="w-full max-w-md">
          <ValidatedForm className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="royal-search-leading absolute left-3 top-2.5 text-slate-400" size={17} />
              <input
                name="q"
                aria-label="Search gallery projects"
                placeholder={isHi ? 'गेट, जाली, शटर या रेलिंग खोजें...' : 'Search projects by keyword…'}
                defaultValue={q}
                className="!pl-9 !pr-8 !py-2 !text-sm w-full"
              />
              {q && (
                <Link
                  href="/gallery"
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition"
                  title={isHi ? 'सर्च साफ़ करें' : 'Clear search'}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </Link>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition shrink-0"
            >
              {isHi ? 'खोजें' : 'Search'}
            </button>
          </ValidatedForm>
          {q && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                {isHi ? 'सर्च फ़िल्टर:' : 'Query:'} <strong className="font-semibold text-slate-900">&quot;{q}&quot;</strong>
              </span>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                <span>✕ {isHi ? 'सर्च हटाएं' : 'Clear search'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="card mt-8 p-8 text-red-600">
          Gallery could not be loaded.
        </p>
      ) : !items.length ? (
        <div className="card mt-8 p-12 text-center text-sm text-slate-500">
          {cursor
            ? (isHi ? 'इस पेज पर आगे कोई प्रोजेक्ट नहीं है।' : 'No further projects on this page. Return to the first page to browse again.')
            : q
            ? (isHi ? `"${q}" के लिए कोई प्रोजेक्ट नहीं मिला।` : 'No gallery projects match your search keyword.')
            : (isHi ? 'जल्द ही हमारी टीम द्वारा प्रोजेक्ट तस्वीरें यहाँ अपलोड की जाएंगी।' : 'Project photographs will appear here once published by our team.')}
          {q && (
            <div className="mt-4">
              <Link
                href="/gallery"
                className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                {isHi ? 'सभी प्रोजेक्ट देखें' : 'View all projects'}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => {
            const asset = Array.isArray(g.media_assets) ? g.media_assets[0] : g.media_assets;
            return (
              <article key={g.id} className="card overflow-hidden hover:shadow-md transition">
                {cloud && asset?.resource_type === 'image' && (
                  <Image
                    src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_900/${asset.public_id}`}
                    width={900}
                    height={600}
                    alt={g.alt_text}
                    className="aspect-[3/2] w-full object-cover"
                  />
                )}
                <h2 className="p-5 text-sm font-bold text-slate-800">{g.name}</h2>
              </article>
            );
          })}
        </div>
      )}

      {items.length > 0 && (cursor || nextCursor) && (
        <div className="mt-10">
          <DataTablePagination
            ariaLabel="Gallery pages"
            currentCount={items.length}
            totalCount={totalCount}
            pageSize={publicPageSize}
            hasPreviousPage={!!cursor}
            hasNextPage={!error && !!nextCursor}
            firstPageHref={browseHref('/gallery', { q })}
            nextPageHref={nextCursor ? browseHref('/gallery', { q }, nextCursor) : undefined}
            nextPageLabel="More projects"
            entityName="projects"
          />
        </div>
      )}
    </section>
  );
}