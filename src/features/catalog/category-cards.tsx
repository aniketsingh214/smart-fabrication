import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { ProductVisual } from '@/components/product-visual';

export async function CategoryCards() {
  const db = await serverClient();
  const { data, error } = await db.from('categories').select('id,name,media_assets!categories_image_media_id_fkey(public_id,resource_type,visibility)').eq('active', true).is('parent_id', null).order('sort_order').order('id').limit(8);
  return (
    <section aria-labelledby="planning-categories" className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-amber-700 font-bold">Royal Gates Collection · A place for every possibility</p>
            <h2 id="planning-categories" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Our Categories <span className="text-lg sm:text-xl font-normal text-slate-400">(हमारी श्रेणियां)</span>
            </h2>
          </div>
          <Link href="/catalog" className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800">
            All categories →
          </Link>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600">Categories could not be loaded. Please retry.</p>
        ) : !data?.length ? (
          <p className="text-sm text-slate-500">Browse our designs or discuss your custom fabrication requirements.</p>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible no-scrollbar">
            {data.map(category => (
              <Link
                href={`/catalog?category=${category.id}`}
                key={category.id}
                className="shrink-0 w-[220px] snap-center sm:w-auto card overflow-hidden border border-slate-200/90 bg-white transition-all duration-200 hover:border-amber-400 hover:shadow-lg rounded-2xl group"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-slate-100">
                  <ProductVisual
                    media={[{ alt_text: category.name, media_assets: category.media_assets }]}
                    alt={category.name}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-3 left-3 text-white text-xs font-semibold px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs">
                    View designs
                  </span>
                </div>
                <h3 className="p-4 text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
