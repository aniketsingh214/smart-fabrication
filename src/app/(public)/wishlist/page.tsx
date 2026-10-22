'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useShop } from '@/features/shop/shop-context';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale-context';
import { getBilingualProductName, getBilingualMaterial } from '@/lib/i18n/catalog-bilingual';

export default function WishlistPage() {
  const { locale, dict } = useLocale();
  const {
    wishlist,
    removeFromWishlist,
    addToCart,
    totalWishlistItems,
    setIsCartOpen
  } = useShop();

  const handleMoveAllToCart = () => {
    wishlist.forEach(item => {
      addToCart({
        product_id: item.id,
        name: item.name,
        slug: item.slug,
        material: item.material,
        price_min_minor: item.price_min_minor,
        image_url: item.image_url
      });
    });
    setIsCartOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-orange-600 transition">
          {dict.nav.home}
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <Link href="/catalog" className="hover:text-orange-600 transition">
          {dict.nav.catalog}
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="font-semibold text-slate-900">{dict.wishlist.title}</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-rose-600">
            {locale === 'hi' ? 'पसंद किए गए डिज़ाइन' : 'Saved Fabrication Inspiration'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {dict.wishlist.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {totalWishlistItems} {locale === 'hi' ? 'डिज़ाइन आपकी लिस्ट में हैं।' : `${totalWishlistItems === 1 ? 'design' : 'designs'} saved to your collection.`}
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMoveAllToCart}
              className="bg-orange-600 hover:bg-orange-700 shadow-sm text-xs font-semibold"
            >
              <ShoppingCart size={15} /> {dict.wishlist.moveAllToCart} ({wishlist.length})
            </Button>
          </div>
        )}
      </div>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div className="card mx-auto max-w-2xl p-12 text-center my-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-rose-50 text-rose-500 mb-6">
            <Heart size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{dict.wishlist.emptyTitle}</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto leading-6">
            {dict.wishlist.emptyMsg}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-slate-900 hover:bg-slate-800">
              <Link href="/catalog">
                {dict.wishlist.exploreBtn} <ArrowRight size={15} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gallery">{dict.nav.gallery}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map(item => {
            const displayName = getBilingualProductName(item.name, locale);
            const displayMaterial = getBilingualMaterial(item.material, locale);
            return (
              <div
                key={item.id}
                className="card group relative flex flex-col overflow-hidden transition-all hover:border-rose-300 hover:shadow-lg"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-bold text-slate-400 uppercase">
                      {item.material}
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label={`Remove ${item.name} from wishlist`}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 hover:bg-white hover:text-red-600 shadow-sm transition backdrop-blur-xs"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                      {displayMaterial}
                    </span>
                    <Link
                      href={`/catalog/${item.slug}`}
                      className="mt-2 block text-sm font-bold text-slate-900 hover:text-orange-600 line-clamp-1 transition"
                    >
                      {displayName}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {item.price_min_minor
                        ? `${locale === 'hi' ? 'शुरुआती कीमत' : 'From'} ${money(item.price_min_minor)}`
                        : (locale === 'hi' ? 'कोटेशन पर' : 'Quotation on request')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart({
                          product_id: item.id,
                          name: item.name,
                          slug: item.slug,
                          material: item.material,
                          price_min_minor: item.price_min_minor,
                          image_url: item.image_url
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-orange-700 transition"
                    >
                      <ShoppingCart size={13} />
                      <span>{dict.product.addToCart}</span>
                    </button>

                    <Link
                      href={`/catalog/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-orange-600 transition"
                    >
                      {locale === 'hi' ? 'देखें' : 'View'} <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

