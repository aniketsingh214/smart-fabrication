import { DemoPhotography } from '@/components/demo-photography';
import Link from 'next/link';
import { Search, ArrowUpRight, ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { serverClient } from '@/lib/supabase/server';
import { money } from '@/lib/utils';
import { ProductVisual } from '@/components/product-visual';
import { DataTablePagination } from '@/components/data-table-pagination';
import { browseHref, publicCursor, publicCursorFilter, publicPageSize, publicWindow, singleQuery, type BrowseQuery } from '@/features/catalog/public-pagination';

export const metadata = { title: 'Explore fabrication designs & catalogue' };

export default async function Catalog({ searchParams }: { searchParams: Promise<BrowseQuery> }) {
  const params = await searchParams;
  const q = singleQuery(params.q).slice(0, 120);
  const categoryParam = singleQuery(params.category);
  const subParam = singleQuery(params.sub);
  const pageParam = singleQuery(params.page);
  const currentPage = pageParam && /^\d+$/.test(pageParam) ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const catalogPageSize = 9;

  let cursor;
  try {
    cursor = publicCursor(params.cursor);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-5 py-12">
        <h1 className="text-3xl font-bold">Designs for your space</h1>
        <p role="alert" className="mt-5 text-red-600">This catalog page link is invalid.</p>
        <Link className="mt-4 inline-block underline" href={browseHref('/catalog', { q, category: categoryParam })}>
          Return to first page
        </Link>
      </div>
    );
  }

  const db = await serverClient();

  // 1. Fetch all active categories & subcategories
  const { data: allCategoriesRaw } = await db
    .from('categories')
    .select('id,name,slug,parent_id,sort_order,media_assets!categories_image_media_id_fkey(public_id,resource_type,visibility)')
    .eq('active', true)
    .order('sort_order');

  const allCategories = allCategoriesRaw ?? [];
  const parentCategories = allCategories.filter(c => !c.parent_id);
  const allSubcategories = allCategories.filter(c => !!c.parent_id);

  // 2. Resolve Active Parent & Subcategory
  let activeParent: (typeof parentCategories)[0] | null = null;
  let activeSub: (typeof allSubcategories)[0] | null = null;

  if (subParam) {
    activeSub = allSubcategories.find(s => s.id === subParam || s.slug === subParam) ?? null;
    if (activeSub) {
      activeParent = parentCategories.find(p => p.id === activeSub?.parent_id) ?? null;
    }
  }

  if (!activeSub && categoryParam) {
    // Check if categoryParam is actually a subcategory
    const directSub = allSubcategories.find(s => s.id === categoryParam || s.slug === categoryParam);
    if (directSub) {
      activeSub = directSub;
      activeParent = parentCategories.find(p => p.id === directSub.parent_id) ?? null;
    } else {
      activeParent = parentCategories.find(p => p.id === categoryParam || p.slug === categoryParam) ?? null;
    }
  }

  const availableSubcategories = activeParent
    ? allSubcategories.filter(s => s.parent_id === activeParent.id)
    : [];

  // 3. Build Products Query
  let query = db
    .from('products')
    .select(
      'id,name,slug,description,material,category_id,price_min_minor,price_max_minor,created_at,product_media(alt_text,sort_order,media_assets(public_id,resource_type,visibility))',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (q) {
    query = query.ilike('name', `%${q.replace(/[%_\\]/g, '')}%`);
  }

  if (activeSub) {
    query = query.eq('category_id', activeSub.id);
  } else if (activeParent) {
    if (availableSubcategories.length > 0) {
      const categoryIds = [activeParent.id, ...availableSubcategories.map(s => s.id)];
      query = query.in('category_id', categoryIds);
    } else {
      query = query.eq('category_id', activeParent.id);
    }
  } else if (categoryParam) {
    query = query.eq('category_id', categoryParam);
  }

  const from = (currentPage - 1) * catalogPageSize;
  const to = from + catalogPageSize - 1;

  if (cursor) {
    query = query.or(publicCursorFilter(cursor)).limit(publicPageSize + 1);
  } else if (typeof (query as unknown as { range?: unknown }).range === 'function') {
    query = (query as unknown as { range: (from: number, to: number) => typeof query }).range(from, to);
  } else {
    query = query.limit(publicPageSize + 1);
  }

  const { data: rawProducts, count: totalCountRaw, error } = await query;

  let products: typeof rawProducts = [];
  let nextCursor: string | null = null;
  if (cursor || typeof (query as unknown as { range?: unknown }).range !== 'function') {
    const windowResult = publicWindow(rawProducts ?? []);
    products = windowResult.items;
    nextCursor = windowResult.nextCursor;
  } else {
    products = rawProducts ?? [];
  }

  const totalCount = totalCountRaw ?? products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / catalogPageSize));

  function getCatalogPageHref(targetPage: number) {
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    const cat = activeParent?.slug ?? categoryParam;
    if (cat) search.set('category', cat);
    const sub = activeSub?.slug ?? subParam;
    if (sub) search.set('sub', sub);
    if (targetPage > 1) search.set('page', String(targetPage));
    return `/catalog${search.size ? '?' + search.toString() : ''}`;
  }

  // Title and subtitle
  const pageHeading = activeSub
    ? activeSub.name
    : activeParent
    ? activeParent.name
    : 'Fabrication Designs Catalogue';

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <ChevronRight size={13} className="text-slate-400" />
        <Link href="/catalog" className={!activeParent && !activeSub ? 'font-semibold text-slate-800' : 'hover:text-orange-600'}>
          Catalogue
        </Link>
        {activeParent && (
          <>
            <ChevronRight size={13} className="text-slate-400" />
            <Link
              href={browseHref('/catalog', { category: activeParent.slug, q })}
              className={!activeSub ? 'font-semibold text-slate-800' : 'hover:text-orange-600'}
            >
              {activeParent.name}
            </Link>
          </>
        )}
        {activeSub && (
          <>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="font-semibold text-orange-600">{activeSub.name}</span>
          </>
        )}
      </nav>

      {/* Header Banner */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="eyebrow flex items-center gap-1.5 text-orange-600">
            <Layers size={14} />
            {activeSub ? `${activeParent?.name} · Subcategory` : activeParent ? 'Category Catalogue' : 'Complete Design Collection'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
            {pageHeading}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            {activeSub
              ? `Browse all verified models under ${activeSub.name}. Dimensions, steel gauges, and finishes are customizable.`
              : activeParent
              ? `Explore our complete range of ${activeParent.name}. Select a subcategory below to filter specific styles.`
              : 'Explore made-to-measure main gates, railings, safety grills, and architectural fabrication.'}
          </p>
        </div>

        {/* Search Input */}
        <form className="flex w-full max-w-md items-center gap-2">
          {activeParent && <input type="hidden" name="category" value={activeParent.slug} />}
          {activeSub && <input type="hidden" name="sub" value={activeSub.slug} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input
              name="q"
              aria-label="Search designs"
              placeholder="Search by design, material or code…"
              defaultValue={q}
              className="!pl-9 !py-2 !text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition">
            Search
          </button>
        </form>
      </div>

      {/* Primary Level 1: Category Filter Pills */}
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Select Category
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={browseHref('/catalog', { q })}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              !activeParent && !activeSub
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </Link>
          {parentCategories.map(cat => {
            const isSelected = activeParent?.id === cat.id;
            return (
              <Link
                key={cat.id}
                href={browseHref('/catalog', { category: cat.slug, q })}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Secondary Level 2: Subcategory Pills (When Active Parent has Subcategories) */}
      {availableSubcategories.length > 0 && (
        <div className="mb-8 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
              {activeParent?.name} Subcategories
            </span>
            <span className="text-[11px] text-orange-700">
              Click a subcategory to view its exclusive catalogue
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={browseHref('/catalog', { category: activeParent?.slug, q })}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                !activeSub
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'border border-orange-200 bg-white text-orange-950 hover:bg-orange-100'
              }`}
            >
              All {activeParent?.name}
            </Link>
            {availableSubcategories.map(sub => {
              const isSelected = activeSub?.id === sub.id;
              return (
                <Link
                  key={sub.id}
                  href={browseHref('/catalog', { category: activeParent?.slug, sub: sub.slug, q })}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'border border-orange-200 bg-white text-orange-950 hover:bg-orange-100'
                  }`}
                >
                  {sub.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Subcategory Visual Quick Showcase (When on parent category without subcategory filter) */}
      {availableSubcategories.length > 0 && !activeSub && !q && !cursor && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Browse by Subcategory</h2>
            <span className="text-xs text-slate-400">4 design styles available</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {availableSubcategories.map(sub => (
              <Link
                key={sub.id}
                href={browseHref('/catalog', { category: activeParent?.slug, sub: sub.slug })}
                className="group card overflow-hidden transition hover:border-orange-400 hover:shadow-md"
              >
                <ProductVisual
                  media={[{ alt_text: sub.name, media_assets: sub.media_assets }]}
                  alt={sub.name}
                  className="aspect-[16/10] w-full object-cover transition group-hover:scale-105 duration-300"
                />
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Explore catalogue</p>
                  </div>
                  <ArrowRight size={15} className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid Header */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="font-semibold text-slate-900">{totalPages > 1 && totalCount ? `${from + 1}–${Math.min(currentPage * catalogPageSize, totalCount)}` : products.length}</strong>
          {totalCount !== undefined && totalCount !== null && (
            <> of <strong className="font-semibold text-slate-900">{totalCount}</strong></>
          )}{' '}
          designs
        </span>
        {activeSub && (
          <Link
            href={browseHref('/catalog', { category: activeParent?.slug })}
            className="text-orange-600 hover:underline"
          >
            Clear subcategory filter
          </Link>
        )}
      </div>

      {/* Product Grid */}
      {error ? (
        <p role="alert" className="card p-8 text-red-600">
          We could not load the catalog. Please try again.
        </p>
      ) : !products.length ? (
        <section className="card p-12 text-center">
          <h2 className="text-xl font-bold">No designs found</h2>
          <p className="mt-3 text-sm text-slate-500">
            {cursor
              ? 'No further designs on this page. Return to the first page to browse again.'
              : q
              ? 'No published designs match your search keyword.'
              : 'No designs found under this subcategory yet.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              View all designs
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Discuss a custom project <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <Link
              href={`/catalog/${p.slug}`}
              key={p.id}
              className="card overflow-hidden transition-all hover:border-orange-300 hover:shadow-lg group"
            >
              <div className="relative overflow-hidden">
                <ProductVisual
                  media={p.product_media}
                  alt={p.name}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                  {p.material}
                </div>
                <h2 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition">
                  {p.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {p.price_min_minor ? `From ${money(p.price_min_minor)}` : 'Request a quote'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                    View design <ArrowUpRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* DataTable Numbered Pagination */}
      {products.length > 0 && (totalPages > 1 || cursor || nextCursor) && (
        <div className="mt-10">
          <DataTablePagination
            ariaLabel="Catalog pages"
            currentCount={products.length}
            totalCount={totalCount}
            pageSize={catalogPageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            hasPreviousPage={currentPage > 1 || !!cursor}
            hasNextPage={currentPage < totalPages || (!error && !!nextCursor)}
            previousPageHref={currentPage > 1 ? getCatalogPageHref(currentPage - 1) : undefined}
            nextPageHref={
              nextCursor
                ? browseHref('/catalog', { q, category: activeParent?.slug ?? categoryParam, sub: activeSub?.slug ?? subParam }, nextCursor)
                : currentPage < totalPages
                ? getCatalogPageHref(currentPage + 1)
                : undefined
            }
            getPageHref={getCatalogPageHref}
            firstPageHref={getCatalogPageHref(1)}
            nextPageLabel="More designs"
            entityName="designs"
          />
        </div>
      )}

      {!error && !products.length && !q && !categoryParam && !cursor && <DemoPhotography />}
    </div>
  );
}