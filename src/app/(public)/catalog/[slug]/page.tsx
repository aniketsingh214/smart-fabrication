import { ProductServices } from '@/features/catalog/product-services';
import { ProductGallery } from '@/features/catalog/product-gallery';
import { designEnquiryUrl } from '@/features/catalog/design-enquiry';
import { ProductVideos } from '@/features/catalog/product-videos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ProductVisual } from '@/components/product-visual';
import { money } from '@/lib/utils';
import { catalogConfiguration } from '@/features/catalog/configuration';
import { ProductConfiguration } from '@/features/catalog/product-configuration';
import { AddToCartButton } from '@/features/shop/add-to-cart-button';
import { WishlistButton } from '@/features/shop/wishlist-button';
import { getBilingualProductName, getBilingualMaterial } from '@/lib/i18n/catalog-bilingual';
import { getServerLocale } from '@/lib/i18n/server';

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await serverClient();
  const { data: productRef, error } = await db
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw new Error('Product could not be loaded');
  if (!productRef) notFound();

  const choices = await catalogConfiguration(db, productRef.id);
  const p = choices;

  const locale = await getServerLocale();
  const isHi = locale === 'hi';

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const firstAsset = p.product_media?.[0]?.media_assets;
  const assetObj = Array.isArray(firstAsset) ? firstAsset[0] : firstAsset;
  const thumbUrl = (cloud && assetObj?.public_id)
    ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_400/${assetObj.public_id}`
    : null;

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
  const photos=p.product_media.slice().sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).flatMap(item=>{
    const asset=Array.isArray(item.media_assets)?item.media_assets[0]:item.media_assets;
    return cloud&&asset?.resource_type==='image'&&asset.visibility==='public'?[{url:`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1600/${asset.public_id}`,alt:item.alt_text||p.name}]:[];
  });
  const {data:contact}=await db.from('site_settings').select('value').eq('name','phone').eq('public',true).maybeSingle();
  const whatsapp=designEnquiryUrl(contact?.value,process.env.NEXT_PUBLIC_SITE_URL||'https://smartfabrication.vercel.app',p);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/catalog" className="text-xs font-semibold text-slate-500 hover:text-orange-600 transition">
        {isHi ? '← वापस सभी डिज़ाइन देखें' : '← Back to designs'}
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-2xl">
            {photos.length?<ProductGallery images={photos}/>:<ProductVisual media={p.product_media} alt={p.name} className="w-full rounded-2xl" />}
            <div className="absolute top-4 right-4 z-10">
              <WishlistButton item={shopItem} />
            </div>
          </div>
          <ProductVideos media={p.product_media} />
        </div>
        <div>
          <p className="eyebrow text-orange-600">
            {isHi ? 'मजबूत कारीगरी • कस्टम फैब्रिकेशन' : 'Custom fabrication'}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            {displayName}
          </h1>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{p.description}</p>
          <dl className="my-7 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5">
            {[
              [isHi ? 'धातु (मटीरियल)' : 'Material', displayMaterial],
              ...(p.design_code ? [[isHi ? 'डिज़ाइन कोड' : 'Design code', p.design_code]] : []),
              ...(p.weight_kg ? [[isHi ? 'अनुमानित वजन' : 'Approximate weight', String(p.weight_kg) + ' kg']] : []),
              [isHi ? 'पेंट / पॉलिश' : 'Finish', p.finish || (isHi ? 'वर्कशॉप से चर्चा करें' : 'Discuss with the workshop')],
              [isHi ? 'नाप (साइज)' : 'Dimensions', p.custom_size ? (isHi ? 'आपकी नाप के अनुसार (Custom size)' : 'Custom size') : (isHi ? 'दिए गए साइज अनुसार' : 'Standard size')],
              [isHi ? 'शुरुआती कीमत' : 'Starting price', p.price_min_minor ? money(p.price_min_minor) : (isHi ? 'नाप के बाद पक्की कीमत' : 'Price on request')]
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400 font-medium">{k}</dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          {p.design_details && <p className="mb-5 whitespace-pre-wrap text-sm text-slate-600">{p.design_details}</p>}
          <ProductServices delivery={p.delivery_availability} installation={p.installation_availability} />
          <ProductConfiguration variants={choices.product_variants} options={choices.product_options} />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline"><Link href={`/contact?product=${p.id}&measurement=1`}>{isHi?'साइट माप का अनुरोध':'Request site measurement'}</Link></Button>
            {whatsapp&&<Button asChild variant="outline"><a href={whatsapp} target="_blank" rel="noopener noreferrer">{isHi?'WhatsApp पर यह डिज़ाइन पूछें':'Enquire about this design on WhatsApp'}</a></Button>}
            <AddToCartButton item={shopItem} variant="primary" label={isHi ? 'प्रोजेक्ट कार्ट में जोड़ें' : 'Add to Project Cart'} />
            <WishlistButton item={shopItem} variant="full" />
            <Button asChild variant="outline">
              <Link href={`/contact?product=${p.id}`}>
                {isHi ? 'पक्की कोटेशन मांगें' : 'Request exact quotation'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/estimate?product=${p.id}`}>
                {isHi ? 'कीमत का अनुमान लगाएं' : 'Get price estimate'}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-400">
            {isHi
              ? '⚡ कारीगर द्वारा घर पर आकर सही नाप लेने के बाद ही पक्की कीमत, मटीरियल और फिटिंग तय की जाएगी।'
              : 'Where product photography is unavailable, a concept illustration is shown. Final dimensions and price are confirmed after measurement.'}
          </p>
        </div>
      </div>
    </div>
  );
}
