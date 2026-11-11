import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { ProductVisual } from '@/components/product-visual';
import { MessageCircle, ArrowRight } from 'lucide-react';

export async function FeaturedProducts() {
  const db = await serverClient();
  const { data, error } = await db
    .from('products')
    .select('id,name,slug,material,product_media(alt_text,sort_order,media_assets(public_id,resource_type,visibility))')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(6);

  if (error) return <p role="alert" className="mx-auto max-w-7xl px-5 py-6 text-sm text-red-700">Featured designs could not be loaded.</p>;
  if (!data?.length) return null;

  return (
    <section aria-labelledby="featured-designs" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:px-8">
      <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-amber-700 font-bold">Selected by the workshop</p>
          <h2 id="featured-designs" className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Popular Gate Designs <span className="text-lg sm:text-xl font-normal text-slate-400">(लोकप्रिय गेट डिज़ाइन्स)</span>
          </h2>
        </div>
        <Link href="/catalog" className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
          Explore all designs <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {data.map(product => {
          const waText = encodeURIComponent(`नमस्ते Royal Gates! मुझे "${product.name}" गेट डिज़ाइन पसंद आया है। कृपया इसकी अनुमानित कीमत और साइज़ विवरण भेजें।`);
          return (
            <div
              key={product.id}
              className="card overflow-hidden flex flex-col justify-between border border-slate-200/90 bg-white transition-all duration-200 hover:border-amber-400 hover:shadow-lg rounded-2xl group"
            >
              <Link href={`/catalog/${product.slug}`} className="block relative overflow-hidden bg-slate-100">
                <ProductVisual
                  media={product.product_media}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{product.material}</p>
                  <h3 className="mt-1 font-bold text-xs sm:text-base text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    <Link href={`/catalog/${product.slug}`}>{product.name}</Link>
                  </h3>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/catalog/${product.slug}`}
                    className="text-[11px] sm:text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    View Design
                  </Link>
                  <a
                    href={`https://wa.me/919876543210?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-[10px] sm:text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageCircle size={12} className="text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
