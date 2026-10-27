import { ValidatedForm } from '@/components/validated-form';
import { DemoPhotography } from '@/components/demo-photography';
import { catalogFilters } from '@/features/catalog/filters';
import Link from 'next/link';
import { Search, ArrowUpRight, ChevronRight, Layers, X } from 'lucide-react';
import { serverClient } from '@/lib/supabase/server';
import { money } from '@/lib/utils';
import { ProductVisual } from '@/components/product-visual';
import { DataTablePagination } from '@/components/data-table-pagination';
import { browseHref as baseBrowseHref, publicCursor, publicCursorFilter, publicPageSize, publicWindow, singleQuery, type BrowseQuery } from '@/features/catalog/public-pagination';
import { WishlistButton } from '@/features/shop/wishlist-button';
import { AddToCartButton } from '@/features/shop/add-to-cart-button';
import { getCategoryDisplayName, getBilingualProductName, getBilingualMaterial, expandSearchQuery } from '@/lib/i18n/catalog-bilingual';
import { getServerLocale } from '@/lib/i18n/server';

export const metadata = { title: 'Explore fabrication designs & catalogue | SmartFabrication' };

export default async function Catalog({ searchParams }: { searchParams: Promise<BrowseQuery> }) {
  const params = await searchParams;
  const filters=catalogFilters(params);
  const browseHref=(path:'/catalog'|'/gallery',values:Parameters<typeof baseBrowseHref>[1],cursor?:string|null)=>{
    const url=new URL(baseBrowseHref(path,values,cursor),'https://catalog.local');
    if(filters.material)url.searchParams.set('material',filters.material);
    if(filters.budget)url.searchParams.set('budget',filters.budget);
    if(filters.sort!=='recent')url.searchParams.set('sort',filters.sort);
    return url.pathname+url.search;
  };
  const q = singleQuery(params.q).slice(0, 120);
  const categoryParam = singleQuery(params.category);
  const subParam = singleQuery(params.sub);
  const pageParam = singleQuery(params.page);
  const currentPage = pageParam && /^\d+$/.test(pageParam) ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const catalogPageSize = 9;

  const locale = await getServerLocale();
  const isHi = locale === 'hi';

  let cursor;
  try {
    cursor = publicCursor(params.cursor);
    // Legacy timestamp cursors only describe the newest-first ordering.
    if(filters.sort!=='recent')cursor=null;
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
    .eq('status', 'published');
  if(filters.material)query=query.ilike('material',`%${filters.material}%`);
  if(filters.budget||filters.sort==='price-low'||filters.sort==='price-high')query=query.gt('price_min_minor',0);
  if(filters.budget)query=query.lte('price_min_minor',Number(filters.budget)*100);
  if(filters.sort==='price-low'||filters.sort==='price-high')query=query.order('price_min_minor',{ascending:filters.sort==='price-low'});
  if(filters.sort==='name')query=query.order('name',{ascending:true});
  query=query.order('created_at',{ascending:false}).order('id',{ascending:false});

  if (q) {
    const cleanQ = q.replace(/[%_\\]/g, '');
    const expanded = expandSearchQuery(cleanQ);
    if (expanded.length > 1) {
      query = query.or(expanded.map(term => `name.ilike.%${term}%`).join(','));
    } else {
      query = query.ilike('name', `%${cleanQ}%`);
    }
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
    if(filters.material)search.set('material',filters.material);
    if(filters.budget)search.set('budget',filters.budget);
    if(filters.sort!=='recent')search.set('sort',filters.sort);
    if (q) search.set('q', q);
    const cat = activeParent?.slug ?? categoryParam;
    if (cat) search.set('category', cat);
    const sub = activeSub?.slug ?? subParam;
    if (sub) search.set('sub', sub);
    if (targetPage > 1) search.set('page', String(targetPage));
    return `/catalog${search.size ? '?' + search.toString() : ''}`;
  }

  // Heading for designs
  const pageHeading = activeSub
    ? getCategoryDisplayName(activeSub.slug, activeSub.name, locale)
    : activeParent
    ? getCategoryDisplayName(activeParent.slug, activeParent.name, locale)
    : isHi
    ? 'Designs for your space (फैब्रिकेशन डिज़ाइन कैटलॉग)'
    : 'Designs for your space (Fabrication Designs)';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-orange-600 transition">
          {isHi ? 'होम' : 'Home'}
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <Link href="/catalog" className={!activeParent && !activeSub ? 'font-semibold text-slate-800' : 'hover:text-orange-600'}>
          {isHi ? 'कैटलॉग' : 'Catalogue'}
        </Link>
        {activeParent && (
          <>
            <ChevronRight size={13} className="text-slate-400" />
            <Link
              href={browseHref('/catalog', { category: activeParent.slug, q })}
              className={!activeSub ? 'font-semibold text-slate-800' : 'hover:text-orange-600'}
            >
              {getCategoryDisplayName(activeParent.slug, activeParent.name, locale)}
            </Link>
          </>
        )}
        {activeSub && (
          <>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="font-semibold text-orange-600">
              {getCategoryDisplayName(activeSub.slug, activeSub.name, locale)}
            </span>
          </>
        )}
      </nav>

      {/* Header Banner */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="eyebrow flex items-center gap-1.5 text-orange-600">
            <Layers size={14} />
            {activeSub
              ? `${getCategoryDisplayName(activeParent?.slug ?? '', activeParent?.name ?? '', locale)} · ${isHi ? 'सब-केटेगरी' : 'Subcategory'}`
              : activeParent
              ? isHi ? 'केटेगरी कैटलॉग' : 'Category Catalogue'
              : isHi ? 'सभी 315+ नए डिज़ाइन' : 'Complete Design Collection'}
          </p>
          <h1
            aria-label="Designs for your space"
            className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl text-slate-900"
          >
            {pageHeading}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
            {isHi
              ? 'मजबूत लोहे के गेट, स्टील गेट, खिड़की की जाली और बालकनी रेलिंग के नए डिज़ाइन। अपनी पसंद का साइज (फीट और इंच) चुनकर कीमत जानें।'
              : 'Explore made-to-measure main gates, railings, safety grills, and architectural fabrication.'}
          </p>
        </div>

        {/* Bilingual Search Form with Category Preservation & Clear Button */}
        <div className="w-full max-w-md">
          <ValidatedForm className="flex w-full flex-wrap items-center gap-2">
            {activeParent && <input type="hidden" name="category" value={activeParent.slug} />}
            {activeSub && <input type="hidden" name="sub" value={activeSub.slug} />}
            <div className="relative min-w-0 flex-1 basis-48">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <input
                name="q"
                aria-label="Search designs"
                placeholder={
                  activeParent
                    ? isHi
                      ? `${activeParent.name} में खोजें...`
                      : `Search in ${activeParent.name}…`
                    : isHi
                    ? 'गेट, जाली, रेलिंग या शटर खोजें...'
                    : 'Search designs by name or code…'
                }
                defaultValue={q}
                className="!pl-9 !pr-8 !py-2 !text-sm w-full"
              />
              {q && (
                <Link
                  href={browseHref('/catalog', { category: activeParent?.slug, sub: activeSub?.slug })}
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
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="text-xs">{isHi?'मटीरियल':'Material contains'}<input name="material" aria-label="Material contains" defaultValue={filters.material} maxLength={80} placeholder="Steel, iron…" className="mt-1 !text-xs"/></label>
              <label className="text-xs">{isHi?'अधिकतम बजट (₹)':'Max starting price (INR)'}<input name="budget" aria-label="Maximum indicative starting price" type="number" min="1" max="99999999" step="1" defaultValue={filters.budget} className="mt-1 !text-xs"/></label>
              <label className="text-xs">{isHi?'क्रम':'Sort designs'}<select name="sort" aria-label="Sort designs" defaultValue={filters.sort} className="mt-1 !text-xs"><option value="recent">Newest</option><option value="price-low">Starting price: low first</option><option value="price-high">Starting price: high first</option><option value="name">Name: A–Z</option></select></label>
            </div>
            <p className="w-full text-xs text-slate-500">{isHi?'बजट और कीमत क्रम केवल दर्ज शुरुआती कीमतों पर हैं। बिना कीमत वाले डिज़ाइन इसमें शामिल नहीं हैं। अंतिम कोटेशन माप के बाद मिलेगा।':'Budget and price sorting use recorded starting prices only; unpriced designs are excluded. Final quotation follows measurement.'}</p>
            <Link href="/catalog" className="text-xs underline">{isHi?'सभी फ़िल्टर हटाएँ':'Reset all filters'}</Link>
          </ValidatedForm>

          {/* Active Search & Category Scope Indicator */}
          {q && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">
                {isHi ? 'सर्च:' : 'Query:'} <strong className="font-semibold text-slate-900">&quot;{q}&quot;</strong>
              </span>
              <Link
                href={browseHref('/catalog', { category: activeParent?.slug, sub: activeSub?.slug })}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                <span>✕ {isHi ? 'सर्च हटाएं' : 'Clear search'}</span>
              </Link>
              {(activeParent || activeSub) && (
                <Link
                  href={browseHref('/catalog', { q })}
                  className="text-[11px] font-medium text-orange-600 hover:underline"
                >
                  {isHi ? 'सभी श्रेणियों में खोजें' : 'Search in all categories'}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Category Filter Pills */}
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          {isHi ? 'केटेगरी चुनें:' : 'Select Category:'}
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
            {isHi ? 'सभी डिज़ाइन (All)' : 'All Categories'}
          </Link>
          {parentCategories.map(cat => {
            const isSelected = activeParent?.id === cat.id;
            const displayName = getCategoryDisplayName(cat.slug, cat.name, locale);
            return (
              <Link
                key={cat.id}
                href={browseHref('/catalog', { category: cat.slug, q })}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {displayName}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Subcategory Pills */}
      {availableSubcategories.length > 0 && (
        <div className="mb-8 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
              {getCategoryDisplayName(activeParent?.slug ?? '', activeParent?.name ?? '', locale)} — {isHi ? 'सब-केटेगरी' : 'Subcategories'}
            </span>
            <span className="text-[11px] text-orange-700">
              {isHi ? 'विशिष्ट डिज़ाइन देखने के लिए क्लिक करें' : 'Click a subcategory to filter'}
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
              {isHi ? 'सभी (All)' : `All ${activeParent?.name}`}
            </Link>
            {availableSubcategories.map(sub => {
              const isSelected = activeSub?.id === sub.id;
              const subDisplayName = getCategoryDisplayName(sub.slug, sub.name, locale);
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
                  {subDisplayName}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Grid Header */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {isHi ? 'दिखा रहे हैं ' : 'Showing '}
          <strong className="font-semibold text-slate-900">
            {totalPages > 1 && totalCount ? `${from + 1}–${Math.min(currentPage * catalogPageSize, totalCount)}` : products.length}
          </strong>
          {totalCount !== undefined && totalCount !== null && (
            <> {isHi ? 'कुल ' : 'of '}<strong className="font-semibold text-slate-900">{totalCount}</strong></>
          )}{' '}
          {isHi ? 'डिज़ाइन' : 'designs'}
        </span>
        {activeSub && (
          <Link
            href={browseHref('/catalog', { category: activeParent?.slug })}
            className="text-orange-600 hover:underline"
          >
            {isHi ? 'सब-केटेगरी हटाएं' : 'Clear subcategory filter'}
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
          <h3 className="sr-only">Let’s create something for you</h3>
          <p className="mt-3 text-sm text-slate-500">
            {cursor
              ? (isHi ? 'इस पेज पर आगे कोई डिज़ाइन नहीं है। पहले पेज पर लौटें।' : 'No further designs on this page. Return to the first page to browse again.')
              : q
              ? (isHi ? `"${q}" के लिए कोई डिज़ाइन नहीं मिला। कृपया कोई दूसरा शब्द खोजें।` : 'No published designs match your search keyword.')
              : (isHi ? 'इस केटेगरी में अभी कोई डिज़ाइन उपलब्ध नहीं है।' : 'No designs found under this subcategory yet.')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              {isHi ? 'सभी डिज़ाइन देखें' : 'View all designs'}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>{isHi ? 'कस्टम काम की चर्चा करें' : 'Discuss a custom project'}</span> <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => {
            const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const firstAsset = p.product_media?.[0]?.media_assets;
            const assetObj = Array.isArray(firstAsset) ? firstAsset[0] : firstAsset;
            const thumbUrl = (cloud && assetObj?.public_id) ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_400/${assetObj.public_id}` : null;
            const shopItem = {
              id: p.id,
              product_id: p.id,
              name: p.name,
              slug: p.slug,
              material: p.material,
              price_min_minor: p.price_min_minor,
              image_url: thumbUrl
            };

            const displayName = getBilingualProductName(p.name, locale);
            const displayMaterial = getBilingualMaterial(p.material, locale);

            return (
              <div
                key={p.id}
                className="card group relative flex flex-col overflow-hidden transition-all hover:border-orange-300 hover:shadow-lg"
              >
                <div className="relative overflow-hidden">
                  <Link href={`/catalog/${p.slug}`} className="block">
                    <ProductVisual
                      media={p.product_media}
                      alt={p.name}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton item={shopItem} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-600 line-clamp-1">
                      {displayMaterial}
                    </div>
                    <Link href={`/catalog/${p.slug}`} className="block">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition">
                        {displayName}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {p.price_min_minor ? `${isHi ? 'शुरुआती ' : 'From '}${money(p.price_min_minor)}` : (isHi ? 'कीमत पूछें' : 'Request a quote')}
                    </span>
                    <div className="flex items-center gap-2">
                      <AddToCartButton item={shopItem} variant="compact" label={isHi ? 'जोड़ें' : 'Add'} />
                      <Link
                        href={`/catalog/${p.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
                      >
                        {isHi ? 'देखें' : 'View'} <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
            nextPageLabel={isHi ? 'और डिज़ाइन देखें (More designs)' : 'More designs'}
            entityName={isHi ? 'डिज़ाइन' : 'designs'}
          />
        </div>
      )}

      {!error && !products.length && !q && !categoryParam && !cursor && <DemoPhotography />}
    </div>
  );
}
