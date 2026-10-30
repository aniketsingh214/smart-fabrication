import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { catalogConfiguration } from '@/features/catalog/configuration';
import { ProductConfiguration } from '@/features/catalog/product-configuration';
import { ProductPreviewGallery } from '@/features/catalog/product-preview-gallery';
import { ProductVideos } from '@/features/catalog/product-videos';
import { ProductServices } from '@/features/catalog/product-services';
import { AppError } from '@/lib/errors';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  ShieldCheck,
  Tag,
  Layers,
  Sparkles,
  Scale,
  Package,
  Wrench,
  Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPreview({ params }: PageProps) {
  const { id } = await params;
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login');

  const { data: allowed } = await db.rpc('has_permission', { requested: 'catalog.read' });
  if (!allowed) notFound();

  const { data: canWrite } = await db.rpc('has_permission', { requested: 'catalog.write' });

  let product: any;
  try {
    product = await catalogConfiguration(db, id, true);
  } catch (e) {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  }

  const categoryName = Array.isArray(product.categories)
    ? product.categories[0]?.name
    : product.categories?.name || 'फैब्रिकेशन कैटलॉग';

  const isPublished = product.status === 'published';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-slate-200/80 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/admin" className="hover:text-amber-700 transition">
                डैशबोर्ड
              </Link>
              <span>/</span>
              <Link href="/admin/products" className="hover:text-amber-700 transition">
                कैटलॉग प्रोडक्ट्स
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                {product.name}
              </span>
            </nav>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/admin/products">
                  <ArrowLeft size={14} />
                  वापस लिस्ट पर
                </Link>
              </Button>

              {canWrite && (
                <Button asChild size="sm" className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700 text-xs shadow-xs">
                  <Link href={`/admin/products?edit=${product.id}`}>
                    <Pencil size={14} />
                    प्रोडक्ट एडिट करें
                  </Link>
                </Button>
              )}

              {isPublished && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs border-slate-300">
                  <Link href={`/catalog/${product.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                    वेबसाइट पर देखें
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Staff Preview Notice Banner */}
        <div className="mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <ShieldCheck size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    स्टाफ प्राइवेट प्रीव्यू (Staff Preview)
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isPublished
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPublished ? '🟢 Published (लाइव)' : '🟡 Draft (प्राइवेट ड्राफ्ट)'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  यह विशेष रूप से स्टाफ के लिए डिज़ाइन किया गया प्रीव्यू है। यहाँ से आप तस्वीरों का क्रम व मुख्य कवर फोटो (Primary Image) चुन सकते हैं।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-600">
                SKU: {product.sku}
              </span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                {categoryName}
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Interactive Photos, Videos & Primary Selection */}
          <div className="space-y-6 lg:col-span-7">
            {/* Interactive Photo Gallery with Primary Selector */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <ProductPreviewGallery
                productId={product.id}
                productName={product.name}
                initialMedia={product.product_media || []}
                canWrite={Boolean(canWrite)}
              />
            </div>

            {/* Product Videos */}
            {product.product_media?.some((m: any) => m.media_assets?.resource_type === 'video') && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  वर्कशॉप वीडियो (Product Video)
                </h3>
                <ProductVideos media={product.product_media} />
              </div>
            )}

            {/* Description & Specification Details */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Info size={16} className="text-amber-600" />
                उत्पाद का विवरण (Description)
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {product.description || 'कोई विशेष विवरण दर्ज नहीं किया गया है।'}
              </p>
            </div>
          </div>

          {/* Right Column: Pricing, Specs, Services & Fabrication Variants */}
          <div className="space-y-6 lg:col-span-5">
            {/* Title & Price Header Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Tag size={14} />
                <span>{categoryName}</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {product.name}
              </h1>

              {/* Price Banner */}
              <div className="mt-4 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
                <div className="text-xs font-semibold text-amber-900">अनुमानित शुरुआती कीमत (Indicative Price)</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-950 sm:text-3xl">
                    {product.price_min_minor
                      ? money(product.price_min_minor)
                      : 'नाप के बाद पक्की कीमत'}
                  </span>
                  {product.price_max_minor && product.price_max_minor > product.price_min_minor && (
                    <span className="text-sm font-medium text-amber-800">
                      से {money(product.price_max_minor)} तक
                    </span>
                  )}
                </div>
                {product.weight_kg && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                    <Scale size={13} />
                    <span>अनुमानित वजन: <strong>{product.weight_kg} kg</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Details Table Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Layers size={16} className="text-amber-600" />
                मुख्य तकनीकी विवरण (Specifications)
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">मटीरियल (धातु)</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{product.material || 'माइल्ड स्टील'}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">पेंट / पॉलिश (Finish)</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{product.finish || 'चर्चा अनुसार'}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">डिज़ाइन कोड</dt>
                  <dd className="mt-1 font-semibold text-slate-800 font-mono">{product.design_code || '—'}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">नाप (Custom Size)</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {product.custom_size ? 'कस्टम नाप (Made to Measure)' : 'तयशुदा साइज'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Services (Delivery & Installation) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Package size={16} className="text-amber-600" />
                सर्विस व इंस्टॉलेशन (Workshop Services)
              </h3>
              <ProductServices
                delivery={product.delivery_availability}
                installation={product.installation_availability}
              />
            </div>

            {/* Fabrication Variants & Options */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Wrench size={16} className="text-amber-600" />
                साइज वेरिएंट्स व विकल्प (Fabrication Sizing)
              </h3>
              <ProductConfiguration
                variants={product.product_variants}
                options={product.product_options}
                preview
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
